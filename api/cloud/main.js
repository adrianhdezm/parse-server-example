Parse.Cloud.define("deleteAll", async (request) => {
  const className = request.params.className;

  if (!className || typeof className !== "string") {
    throw new Error('Parameter "className" is required and must be a string.');
  }

  // Ensure the user is authenticated
  if (!request.user) {
    throw new Error("Authentication required.");
  }

  try {
    // Count objects before purging
    const query = new Parse.Query(className);
    const count = await query.count({ useMasterKey: true });

    // Purge class
    const schema = new Parse.Schema(className);
    await schema.purge({ useMasterKey: true });

    // Return JSON with deleted object count
    return {
      className,
      deletedObjects: count,
      status: "success",
    };
  } catch (error) {
    throw new Error(`Failed to purge class "${className}": ${error.message}`);
  }
});
