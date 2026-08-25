import { useState, useEffect } from 'react';
import axios from 'axios';

export function useContent(pageId: string) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${API_URL}/api/content/${pageId}`);
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
