"use strict";


const fs = require("fs/promises");
const path = require("path");


const FILES_DIR = process.env.FILES_DIR || "/parse-server/files";
const MASTER_OPTIONS = { useMasterKey: true };
const BATCH_SIZE = 1000;


/**
 * Return Parse Server base URL without trailing slash.
 * Expected example:
 *   https://your-host/api
 */
const getParseServerUrl = () => {
  const parseServerUrl =
    process.env.PARSE_PUBLIC_SERVER_URL || process.env.PARSE_SERVER_URL;


  if (!parseServerUrl) {
    throw new Error(
      "PARSE_PUBLIC_SERVER_URL or PARSE_SERVER_URL must be configured."
    );
  }


  return parseServerUrl.replace(/\/$/, "");
};


/**
 * Delete a physical file through Parse REST file endpoint.
 * This works for files known by Parse.
 */
const deleteFileFromStorage = async (fileName) => {
  if (!fileName || typeof fileName !== "string") {
    throw new Error("Invalid fileName.");
  }


  const serverUrl = getParseServerUrl();
  const url = `${serverUrl}/files/${encodeURIComponent(fileName)}`;


  try {
    const response = await Parse.Cloud.httpRequest({
      method: "DELETE",
      url,
      headers: {
        "X-Parse-Application-Id": process.env.PARSE_SERVER_APPLICATION_ID,
        "X-Parse-Master-Key": process.env.PARSE_SERVER_MASTER_KEY,
      },
    });


    return {
      success: true,
      status: response.status,
      url,
      fileName,
    };
  } catch (error) {
    const statusCode = error?.status || error?.response?.status;
    const message =
      error?.message || error?.data?.error || "Unknown storage delete error";


    const wrapped = new Error(
      `Failed to delete file "${fileName}" via ${url}. Status: ${
        statusCode || "unknown"
      }. ${message}`
    );
    wrapped.status = statusCode;
    throw wrapped;
  }
};


/**
 * Recursively get all physical files from FILES_DIR.
 */
const getFilesRecursive = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];


  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }


    const fullPath = path.join(dir, entry.name);


    if (entry.isDirectory()) {
      const nested = await getFilesRecursive(fullPath);
      result.push(...nested);
    } else if (entry.isFile()) {
      result.push(fullPath);
    }
  }


  return result;
};


/**
 * Read all physical files with metadata.
 */
const getPhysicalFiles = async () => {
  const fullPaths = await getFilesRecursive(FILES_DIR);
  const files = [];


  for (const fullPath of fullPaths) {
    const stat = await fs.stat(fullPath);
    files.push({
      name: path.basename(fullPath),
      fullPath,
      size: stat.size,
      mtime: stat.mtime,
      ctime: stat.ctime,
    });
  }


  return files;
};


/**
 * Paginate through _File records.
 * Safe enough for small/medium datasets.
 */
const getAllParseFileObjects = async () => {
  const all = [];
  let skip = 0;


  while (true) {
    const query = new Parse.Query("_File");
    query.ascending("createdAt");
    query.skip(skip);
    query.limit(BATCH_SIZE);


    const batch = await query.find(MASTER_OPTIONS);
    if (!batch.length) {
      break;
    }


    all.push(...batch);
    skip += batch.length;


    if (batch.length < BATCH_SIZE) {
      break;
    }
  }


  return all;
};


const getAllParseFileNames = async () => {
  const objects = await getAllParseFileObjects();
  return objects.map((obj) => obj.get("name")).filter(Boolean);
};


const ensureAuthenticated = (request) => {
  if (!request.user) {
    throw new Error("Authentication required.");
  }
};


const parseDateParam = (date) => {
  if (!date) {
    throw new Error('Parameter "date" is required.');
  }

  let normalizedDateInput = date;
  if (date instanceof Date) {
    normalizedDateInput = date.toISOString();
  } else if (typeof date === "string") {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      normalizedDateInput = `${year}-${month}-${day}T00:00:00.000Z`;
    }
  }

  const parsedDate = new Date(normalizedDateInput);


  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date.");
  }


  return parsedDate;
};


/**
 * ------------------------------------------------------------------
 * deleteAll
 * Purges an entire class schema and returns deleted object count.
 * ------------------------------------------------------------------
 */
Parse.Cloud.define("deleteAll", async (request) => {
  const className = request.params.className;


  if (!className || typeof className !== "string") {
    throw new Error('Parameter "className" is required and must be a string.');
  }


  ensureAuthenticated(request);


  try {
    const query = new Parse.Query(className);
    const count = await query.count(MASTER_OPTIONS);


    const schema = new Parse.Schema(className);
    await schema.purge(MASTER_OPTIONS);


    return {
      className,
      deletedObjects: count,
      status: "success",
    };
  } catch (error) {
    throw new Error(`Failed to purge class "${className}": ${error.message}`);
  }
});


/**
 * ------------------------------------------------------------------
 * getFileStoreStats
 * Returns DB count, physical file count, total bytes, orphan files, etc.
 * ------------------------------------------------------------------
 */
Parse.Cloud.define("getFileStoreStats", async (request) => {
  ensureAuthenticated(request);


  try {
    const physicalFiles = await getPhysicalFiles();
    const parseFileObjects = await getAllParseFileObjects();


    const diskFileNames = physicalFiles.map((f) => f.name);
    const dbFileNames = parseFileObjects
      .map((f) => f.get("name"))
      .filter(Boolean);


    const diskSet = new Set(diskFileNames);
    const dbSet = new Set(dbFileNames);


    const orphanOnDisk = physicalFiles
      .filter((f) => !dbSet.has(f.name))
      .map((f) => ({
        name: f.name,
        size: f.size,
        mtime: f.mtime,
        fullPath: f.fullPath,
      }));


    const missingOnDisk = dbFileNames.filter((name) => !diskSet.has(name));


    const totalBytes = physicalFiles.reduce((sum, f) => sum + f.size, 0);


    return {
      success: true,
      filesDir: FILES_DIR,
      parseFileCount: dbFileNames.length,
      physicalFileCount: physicalFiles.length,
      totalBytes,
      orphanOnDiskCount: orphanOnDisk.length,
      missingOnDiskCount: missingOnDisk.length,
      orphanOnDisk,
      missingOnDisk,
      diskFileNames,
      dbFileNames,
    };
  } catch (error) {
    throw new Error(`Failed to read file store stats: ${error.message}`);
  }
});


/**
 * ------------------------------------------------------------------
 * deleteFileStoreBeforeDate
 *
 * Params:
 *   - date: required
 *   - className: optional
 *
 * Behavior:
 *   1) Deletes class records older than date (if className is provided)
 *   2) Deletes registered Parse files older than date
 *   3) Deletes orphan physical files older than date
 * ------------------------------------------------------------------
 */
Parse.Cloud.define("deleteFileStoreBeforeDate", async (request) => {
  ensureAuthenticated(request);


  const { date, className } = request.params;
  const parsedDate = parseDateParam(date);


  let deletedRecords = 0;
  let deletedFiles = 0;
  let deletedOrphanFiles = 0;
  const deletedRegisteredFileNames = [];
  const deletedOrphanFileNames = [];


  try {
    /**
     * 1) Delete records from a target class if requested
     */
    if (className) {
      if (typeof className !== "string") {
        throw new Error('Parameter "className" must be a string.');
      }


      while (true) {
        const query = new Parse.Query(className);
        query.lessThan("createdAt", parsedDate);
        query.limit(BATCH_SIZE);


        const results = await query.find(MASTER_OPTIONS);
        if (!results.length) {
          break;
        }


        await Parse.Object.destroyAll(results, MASTER_OPTIONS);
        deletedRecords += results.length;


        if (results.length < BATCH_SIZE) {
          break;
        }
      }
    }


    /**
     * 2) Delete files registered in _File before date
     */
    while (true) {
      const fileQuery = new Parse.Query("_File");
      fileQuery.lessThan("createdAt", parsedDate);
      fileQuery.ascending("createdAt");
      fileQuery.limit(BATCH_SIZE);


      const fileResults = await fileQuery.find(MASTER_OPTIONS);
      if (!fileResults.length) {
        break;
      }


      for (const fileObject of fileResults) {
        const fileName = fileObject.get("name");


        if (!fileName) {
          continue;
        }


        try {
          await deleteFileFromStorage(fileName);
        } catch (error) {
          const statusCode = error?.status || error?.response?.status;


          // If file is already gone physically, remove _File record anyway
          if (statusCode !== 404) {
            throw error;
          }
        }


        deletedRegisteredFileNames.push(fileName);
      }


      await Parse.Object.destroyAll(fileResults, MASTER_OPTIONS);
      deletedFiles += fileResults.length;


      if (fileResults.length < BATCH_SIZE) {
        break;
      }
    }


    /**
     * 3) Delete physical orphan files older than date
     */
    const allPhysicalFiles = await getPhysicalFiles();
    const parseFileNamesAfterCleanup = new Set(await getAllParseFileNames());


    for (const file of allPhysicalFiles) {
      if (parseFileNamesAfterCleanup.has(file.name)) {
        continue;
      }


      // Use mtime for physical orphan cleanup
      if (file.mtime >= parsedDate) {
        continue;
      }


      await fs.unlink(file.fullPath);
      deletedOrphanFiles += 1;
      deletedOrphanFileNames.push(file.name);
    }


    return {
      success: true,
      filesDir: FILES_DIR,
      date: parsedDate.toISOString(),
      className: className || null,
      deletedRecords,
      deletedFiles,
      deletedOrphanFiles,
      deletedRegisteredFileNames,
      deletedOrphanFileNames,
      message: "Cleanup completed successfully.",
    };
  } catch (error) {
    throw new Error(`Cleanup failed: ${error.message}`);
  }
});
