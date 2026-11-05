import { IRequestService } from '@/service/common/request';

export interface ISiyuanClientOptions {
  request: IRequestService;
  accessToken?: string;
  /** 服务器地址，Docker / 服务器部署版必填；不填则使用桌面版内核默认地址 */
  origin?: string;
}

export interface ISiyuanUploadImageResponse {
  data: {
    succMap: {
      [key: string]: string;
    };
  };
}

export interface ISiyuanFetchNotesResponse {
  data: {
    files?: string[] | { name: string; id: string; closed?: boolean }[];
    notebooks?: string[] | { name: string; id: string; closed?: boolean }[];
  };
}
