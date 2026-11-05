import { CreateDocumentRequest } from './../../services/interface';
import { IExtendRequestHelper } from '@/service/common/request';
import { RequestHelper } from '@/service/request/common/request';
import {
  ISiyuanClientOptions,
  ISiyuanUploadImageResponse,
  ISiyuanFetchNotesResponse,
} from './types';

/** 桌面版内核默认地址；Docker / 服务器部署版通过 origin 配置 */
const SIYUAN_DEFAULT_BASE_URL = 'http://127.0.0.1:6806/';

export class SiYuanClient {
  private options: ISiyuanClientOptions;
  private request: IExtendRequestHelper;
  /** 实际请求的基础地址，以 / 结尾 */
  private baseUrl: string;

  constructor(options: ISiyuanClientOptions) {
    this.options = options;
    this.baseUrl = options.origin
      ? `${options.origin.replace(/\/+$/, '')}/`
      : SIYUAN_DEFAULT_BASE_URL;
    const headers: Record<string, string> = {};
    if (options.accessToken) {
      headers.Authorization = `Token ${options.accessToken}`;
    }
    this.request = new RequestHelper({
      baseURL: this.baseUrl,
      headers: headers,
      request: this.options.request,
    });
  }

  listNotebooks = async (): Promise<{ id: string; name: string }[]> => {
    const res = await this.request.post<ISiyuanFetchNotesResponse>(`api/notebook/lsNotebooks`, {
      data: {},
    });
    return (res.data.notebooks ?? res.data.files ?? [])
      .map(p => {
        if (typeof p === 'object') {
          return p;
        }
        return {
          name: p.split('/')[p.split('/').length - 1],
          id: p.split('/')[p.split('/').length - 1],
          closed: false,
        };
      })
      .filter(e => {
        return !e.closed;
      });
  };

  /** 去掉 markdown 中的绝对资源地址前缀，转为思源可识别的相对路径 */
  private normalizeMarkdown = (markdown: string): string => {
    let result = markdown;
    const candidates = [this.baseUrl, SIYUAN_DEFAULT_BASE_URL];
    for (const base of candidates) {
      result = result.replaceAll(base, '').replaceAll(base.replace(/\/$/, ''), '');
    }
    return result;
  };

  createNote = async (data: CreateDocumentRequest) => {
    const response = await this.request.post<{ code: number; msg: string; data: string }>(
      `api/filetree/createDocWithMd`,
      {
        data: {
          notebook: data.repositoryId,
          path: `${data.title}.sy`,
          markdown: this.normalizeMarkdown(data.content),
        },
      }
    );
    if (response.code !== 0) {
      throw new Error(response.msg);
    }
    return response.data;
  };

  uploadImage = async (blob: Blob) => {
    let formData = new FormData();
    formData.append('assetsDirPath', '/assets/');
    const fileName = `${Date.now()}.png`;
    formData.append('file[]', new File([blob], fileName));
    const response = await this.request.postForm<ISiyuanUploadImageResponse>(`api/asset/upload`, {
      data: formData,
    });
    return `${this.baseUrl}${response.data.succMap[fileName]}`;
  };
}
