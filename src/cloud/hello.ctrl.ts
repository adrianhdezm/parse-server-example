import { format } from 'date-fns';

interface HelloCtrlResponse {
  message: string;
  date: string;
}

export const helloCtrl = async (_req?: Parse.Cloud.FunctionRequest): Promise<HelloCtrlResponse> => {
  return {
    message: 'Hello World!',
    date: format(new Date(2014, 1, 11), 'MM/dd/yyyy')
  };
};
