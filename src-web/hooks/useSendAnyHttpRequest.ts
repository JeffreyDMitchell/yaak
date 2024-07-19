import { useMutation } from '@tanstack/react-query';
import { save } from '@tauri-apps/plugin-dialog';
import slugify from 'slugify';
import { trackEvent } from '../lib/analytics';
import type { HttpResponse } from '../lib/models';
import { getHttpRequest } from '../lib/store';
import { invokeCmd } from '../lib/tauri';
import { useActiveCookieJar } from './useActiveCookieJar';
import { useActiveEnvironment } from './useActiveEnvironment';
import { useAlert } from './useAlert';

export function useSendAnyHttpRequest(options: { download?: boolean } = {}) {
  const environment = useActiveEnvironment();
  const alert = useAlert();
  const { activeCookieJar } = useActiveCookieJar();
  return useMutation<HttpResponse | null, string, string | null>({
    mutationKey: ['send_any_request'],
    mutationFn: async (id) => {
      const request = await getHttpRequest(id);
      if (request == null) {
        return null;
      }

      let downloadDir: string | null = null;
      if (options.download) {
        downloadDir = await save({
          title: 'Select Download Destination',
          defaultPath: slugify(request.name, { lower: true, trim: true, strict: true }),
        });
        if (downloadDir == null) {
          return null;
        }
      }

      return invokeCmd('cmd_send_http_request', {
        requestId: id,
        environmentId: environment?.id,
        downloadDir: downloadDir,
        cookieJarId: activeCookieJar?.id,
      });
    },
    onSettled: () => trackEvent('http_request', 'send'),
    onError: (err) => alert({ id: 'send-failed', title: 'Send Failed', body: err }),
  });
}