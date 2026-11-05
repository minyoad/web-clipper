import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.less';
import { Input } from 'antd';
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import localeService from '@/common/locales';
import useOriginForm from '@/hooks/useOriginForm';

interface SiyuanFormProps {
  info?: SiyuanBackendServiceConfig;
}

interface SiyuanBackendServiceConfig {
  accessToken?: string;
  origin?: string;
}

const form: React.FC<FormComponentProps & SiyuanFormProps> = props => {
  const {
    form: { getFieldDecorator },
    info,
  } = props;

  // 「检验」按钮会对填写的服务器地址申请访问权限（Docker / 服务器部署版需要）
  const { handleAuthentication } = useOriginForm({
    form,
    initStatus: !!info,
  });

  let initData: Partial<SiyuanBackendServiceConfig> = {};
  if (info) {
    initData = info;
  }
  let editMode = info ? true : false;

  /** origin 为可选配置：桌面版保持默认即可，Docker / 服务器部署版填写服务器地址 */
  const originUrlRule = {
    validator(_r: any, value: string, callback: Function) {
      if (!value) {
        return callback();
      }
      try {
        const _url = new URL(value);
        if (_url.origin !== value) {
          props.form.setFieldsValue({
            origin: _url.origin,
          });
        }
        callback();
      } catch (_error) {
        return callback(
          <FormattedMessage
            id="hooks.useOriginForm.origin.message"
            defaultMessage={`Wrong format,Examples https://developer.mozilla.org`}
          />
        );
      }
    },
  };

  return (
    <Fragment>
      <Form.Item
        label={localeService.format({
          id: 'backend.services.siyuan.form.origin',
          defaultMessage: 'Host',
        })}
      >
        {getFieldDecorator('origin', {
          initialValue: initData.origin || 'http://127.0.0.1:6806',
          rules: [originUrlRule],
        })(
          <Input.Search
            enterButton={
              <FormattedMessage
                id="backend.services.siyuan.form.hostTest"
                defaultMessage="test"
              />
            }
            disabled={editMode}
            onSearch={handleAuthentication}
          />
        )}
      </Form.Item>
      <Form.Item
        label={localeService.format({
          id: 'backend.services.siyuan.form.accessToken',
          defaultMessage: 'Access Token',
        })}
      >
        {getFieldDecorator('accessToken', {
          initialValue: initData.accessToken,
        })(<Input disabled={editMode} />)}
      </Form.Item>
    </Fragment>
  );
};

export default form;
