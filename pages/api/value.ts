import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { value } = req.query
  res.status(200).json({ value: `Fetched(${value})` })
}
