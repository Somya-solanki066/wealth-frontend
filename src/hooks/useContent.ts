import { useState, useEffect } from 'react';
import axios from 'axios';
import { getBackendApiUrl } from '@/lib/backendUrl';

export function useContent(pageId: string) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${getBackendApiUrl()}/content/${pageId}`);
        setContent(response.data.data || {});
      } catch (err: any) {
        console.error(`Failed to load content for ${pageId}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (pageId) {
      fetchContent();
    }
  }, [pageId]);

  return { content, loading, error };
}
