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
    let sub: Subscription;

    const init = async () => {
      const db = await getDatabase();
      // If gardenId is provided, filter by it. Otherwise show all (or handle as main)
      const query = gardenId 
        ? db.planted.find({ selector: { bedId: gardenId } })
        : db.planted.find();
      
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
