import { useState, useEffect } from 'react';
import { getDatabase } from '../db';
import { Subscription } from 'rxjs';

/**
 * HOOK: useInventory
 * Subscribes to the RxDB 'inventory' collection and returns real-time updates.
 * (Note: Although schemas.ts didn't have 'inventory' initially, we should ensure it does).
 */
export const useInventory = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let sub: Subscription;

    const init = async () => {
      const db = await getDatabase();
      
      // Ensure the collection exists (defensive)
      if (!db.inventory) {
        console.error('Inventory collection not found in DB');
        return;
      }

      const query = db.inventory.find();
      
      sub = query.$.subscribe(results => {
        setItems(results.map(doc => doc.toJSON()));
      });
    };

    init();

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  return items;
};
