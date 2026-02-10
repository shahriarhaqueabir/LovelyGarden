import { useState, useEffect } from 'react';
import { getDatabase } from '../db';
import { Subscription } from 'rxjs';
import type { LogbookDocument } from '../db/types';

/**
 * HOOK: useLogbook
 * Subscribes to the RxDB 'logbook' collection and returns real-time updates.
 */
export const useLogbook = () => {
  const [entries, setEntries] = useState<LogbookDocument[]>([]);

  useEffect(() => {
    let sub: Subscription;

    const init = async () => {
      const db = await getDatabase();
      
      if (!db.logbook) {
        console.error('Logbook collection not found in DB');
        return;
      }

      // Sort by date descending
      const query = db.logbook.find({
        sort: [{ date: 'desc' }]
      });
      
      sub = query.$.subscribe(results => {
        setEntries(results.map(doc => doc.toJSON()));
      });
    };

    init();

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  return entries;
};
