import type { NextApiRequest, NextApiResponse } from 'next';
import { executeDataRequest } from '../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = await executeDataRequest('SELECT TOP 5 * FROM users', [], false);

  if (result) {
    res.status(200).json({ data: result });
  } else {
    res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
  }
}
