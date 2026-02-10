import { useState, useEffect } from 'react';
import { getDatabase } from '../db';
import { Subscription } from 'rxjs';
import type { PlantedDocument } from '../db/types';

/**
 * HOOK: usePlantedCards
 * Subscribes to the RxDB 'planted' collection and returns real-time updates.
 */
export const usePlantedCards = (gardenId?: string) => {
  const [cards, setCards] = useState<PlantedDocument[]>([]);

  useEffect(() => {
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
