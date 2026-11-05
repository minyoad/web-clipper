import { CompleteStatus } from 'common/backend/interface';
import { Repository, CreateDocumentRequest } from './../interface';
import { DocumentService } from '../../index';
import { IBasicRequestService } from '@/service/common/request';
import { Container } from 'typedi';
import { SiYuanClient } from '../../clients/siyuan/client';
import localeService from '@/common/locales';

/**
 *
 * Document service for self hosted leanote or leanote.com
 */
export default class SiYuanDocumentService implements DocumentService {
  private client: SiYuanClient;
  private origin: string;
  constructor(config: { accessToken?: string; origin?: string }) {
    this.origin = config.origin || '';
    this.client = new SiYuanClient({
      request: Container.get(IBasicRequestService),
      accessToken: config.accessToken,
      origin: config.origin,
    });
  }

  /** Unique account identification */
  getId = () => {
    return 'siyuan';
  };

  getUserInfo = async () => {
    return {
      name: 'siyuan',
      avatar: '',
      homePage: this.origin,
      description: ``,
    };
  };

  getRepositories = async () => {
    let response = await this.client.listNotebooks();
    return response.map(
      ({ name, id }): Repository => {
        return {
          groupId: 'siyuan',
          groupName: localeService.format({
            id: 'backend.services.siyuan.notes',
          }),
          id,
          name,
        };
      }
    );
  };

  createDocument = async (data: CreateDocumentRequest): Promise<CompleteStatus | void> => {
    const id = await this.client.createNote(data);
    return {
      href: `siyuan://blocks/${id}`,
    };
  };
}
