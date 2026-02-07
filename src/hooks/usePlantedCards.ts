import { useState, useEffect } from 'react';
import { getDatabase } from '../db';
import { Subscription } from 'rxjs';

/**
 * HOOK: usePlantedCards
 * Subscribes to the RxDB 'planted' collection and returns real-time updates.
 */
export const usePlantedCards = (gardenId?: string) => {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    // Clear cards immediately when switching gardens to prevent stale data
    setCards([]); 

    let sub: Subscription;

    const init = async () => {
      const db = await getDatabase();
      
      // If no gardenId, do not fetch anything (prevents loading all plants initially)
      if (!gardenId) {
        setCards([]);
        return;
      }

      const query = db.planted.find({ selector: { bedId: gardenId } });
      
      sub = query.$.subscribe(results => {
        setCards(results.map(doc => doc.toJSON()));
      });
    };

    init();

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [gardenId]);

  return cards;
};
