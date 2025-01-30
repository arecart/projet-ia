import { NextResponse } from 'next/server';
import pool from '@/app/db';      
import { verify } from '@/utils/jwt'; 

export async function GET(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('token='))?.split('=')[1];

    if (!tokenCookie) {
      return NextResponse.json({ error: 'Missing token cookie' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await verify(tokenCookie);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const weeklyRows = await pool.query(`
      SELECT 
        u.id AS user_id,
        u.username,
        tu.model_name,
        SUM(tu.prompt_tokens + tu.completion_tokens) AS weekly_tokens,
        SUM(tu.estimated_cost) AS weekly_cost
      FROM token_usage tu
      JOIN users u ON tu.user_id = u.id
      WHERE tu.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY u.id, u.username, tu.model_name
    `);

    const monthlyRows = await pool.query(`
      SELECT 
        u.id AS user_id,
        u.username,
        tu.model_name,
        SUM(tu.prompt_tokens + tu.completion_tokens) AS monthly_tokens,
        SUM(tu.estimated_cost) AS monthly_cost
      FROM token_usage tu
      JOIN users u ON tu.user_id = u.id
      WHERE tu.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY u.id, u.username, tu.model_name
    `);

    const yearlyRows = await pool.query(`
      SELECT
        u.id AS user_id,
        u.username,
        tu.model_name,
        SUM(tu.prompt_tokens + tu.completion_tokens) AS yearly_tokens,
        SUM(tu.estimated_cost) AS yearly_cost
      FROM token_usage tu
      JOIN users u ON tu.user_id = u.id
      WHERE tu.created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)
      GROUP BY u.id, u.username, tu.model_name
    `);

    const totalRows = await pool.query(`
      SELECT
        u.id AS user_id,
        u.username,
        tu.model_name,
        SUM(tu.prompt_tokens + tu.completion_tokens) AS total_tokens,
        SUM(tu.estimated_cost) AS total_cost
      FROM token_usage tu
      JOIN users u ON tu.user_id = u.id
      GROUP BY u.id, u.username, tu.model_name
    `);

    const usageMap = {};

    function ensureKey(userId, modelName, username) {
      const key = `${userId}|${modelName}`;
      if (!usageMap[key]) {
        usageMap[key] = {
          user_id: userId,
          username: username,
          model_name: modelName,
          weeklyTokens: 0,
          weeklyCost: 0,
          monthlyTokens: 0,
          monthlyCost: 0,
          yearlyTokens: 0,
          yearlyCost: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
      return key;
    }

    function mergeRows(rows, dbTokensField, dbCostField, objTokensField, objCostField) {
      rows.forEach((row) => {
        const userId = row.user_id;
        const modelName = row.model_name;
        const username = row.username;

        const key = ensureKey(userId, modelName, username);
        usageMap[key][objTokensField] = row[dbTokensField] || 0;
        usageMap[key][objCostField] = row[dbCostField] || 0;
      });
    }

    mergeRows(weeklyRows, 'weekly_tokens', 'weekly_cost', 'weeklyTokens', 'weeklyCost');
    mergeRows(monthlyRows, 'monthly_tokens', 'monthly_cost', 'monthlyTokens', 'monthlyCost');
    mergeRows(yearlyRows, 'yearly_tokens', 'yearly_cost', 'yearlyTokens', 'yearlyCost');
    mergeRows(totalRows, 'total_tokens', 'total_cost', 'totalTokens', 'totalCost');

    const usageArray = Object.values(usageMap);

    return NextResponse.json(usageArray);

  } catch (err) {
    console.error('Usage error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
