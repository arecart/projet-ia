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

    // 1. Requêtes pour tokens et coûts (token_usage)
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

    // 2. Requêtes pour les sessions (on utilise désormais la table ChatSession)
    const weeklySessionsRows = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS weekly_sessions
      FROM ChatSession
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY user_id
    `);
    const monthlySessionsRows = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS monthly_sessions
      FROM ChatSession
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY user_id
    `);
    const yearlySessionsRows = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS yearly_sessions
      FROM ChatSession
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)
      GROUP BY user_id
    `);
    const totalSessionsRows = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS total_sessions
      FROM ChatSession
      GROUP BY user_id
    `);

    // 3. Requêtes pour les messages (ChatMessage)
    const weeklyMessagesRows = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS weekly_messages
      FROM ChatMessage
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY user_id
    `);
    const monthlyMessagesRows = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS monthly_messages
      FROM ChatMessage
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY user_id
    `);
    const yearlyMessagesRows = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS yearly_messages
      FROM ChatMessage
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 365 DAY)
      GROUP BY user_id
    `);
    const totalMessagesRows = await pool.query(`
      SELECT 
        user_id,
        COUNT(*) AS total_messages
      FROM ChatMessage
      GROUP BY user_id
    `);

    // 4. Construction de l'objet usageMap (basé sur token_usage)
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
          // On ajoutera ensuite les statistiques de sessions et messages
          weeklySessions: 0,
          monthlySessions: 0,
          yearlySessions: 0,
          totalSessions: 0,
          weeklyMessages: 0,
          monthlyMessages: 0,
          yearlyMessages: 0,
          totalMessages: 0,
        };
      }
      return key;
    }

    function mergeRows(rows, dbTokensField, dbCostField, objTokensField, objCostField) {
      rows.forEach((row) => {
        const { user_id, model_name, username } = row;
        const key = ensureKey(user_id, model_name, username);
        usageMap[key][objTokensField] = row[dbTokensField] || 0;
        usageMap[key][objCostField] = row[dbCostField] || 0;
      });
    }

    // Fusion des données tokens/cost
    mergeRows(weeklyRows, 'weekly_tokens', 'weekly_cost', 'weeklyTokens', 'weeklyCost');
    mergeRows(monthlyRows, 'monthly_tokens', 'monthly_cost', 'monthlyTokens', 'monthlyCost');
    mergeRows(yearlyRows, 'yearly_tokens', 'yearly_cost', 'yearlyTokens', 'yearlyCost');
    mergeRows(totalRows, 'total_tokens', 'total_cost', 'totalTokens', 'totalCost');

    // 5. Fusion des données de sessions et messages par utilisateur
    // Ces données sont par utilisateur (sans distinction de modèle)
    function mergeUserRowsGlobal(rows, dbField, objField) {
      rows.forEach((row) => {
        const { user_id } = row;
        let found = false;
        Object.keys(usageMap).forEach((key) => {
          if (key.startsWith(`${user_id}|`)) {
            usageMap[key][objField] = row[dbField] || 0;
            found = true;
          }
        });
        if (!found) {
          // Aucun enregistrement dans token_usage pour cet utilisateur :
          // on crée une entrée avec model_name "global"
          usageMap[`${user_id}|global`] = {
            user_id,
            username: user_id.toString(), // Vous pouvez récupérer le username via une requête séparée si besoin
            model_name: 'global',
            weeklyTokens: 0,
            weeklyCost: 0,
            monthlyTokens: 0,
            monthlyCost: 0,
            yearlyTokens: 0,
            yearlyCost: 0,
            totalTokens: 0,
            totalCost: 0,
            weeklySessions: row[dbField] || 0,
            monthlySessions: 0,
            yearlySessions: 0,
            totalSessions: 0,
            weeklyMessages: 0,
            monthlyMessages: 0,
            yearlyMessages: 0,
            totalMessages: 0,
          };
        }
      });
    }

    // Fusion pour les sessions
    mergeUserRowsGlobal(weeklySessionsRows, 'weekly_sessions', 'weeklySessions');
    mergeUserRowsGlobal(monthlySessionsRows, 'monthly_sessions', 'monthlySessions');
    mergeUserRowsGlobal(yearlySessionsRows, 'yearly_sessions', 'yearlySessions');
    mergeUserRowsGlobal(totalSessionsRows, 'total_sessions', 'totalSessions');

    // Fusion pour les messages
    mergeUserRowsGlobal(weeklyMessagesRows, 'weekly_messages', 'weeklyMessages');
    mergeUserRowsGlobal(monthlyMessagesRows, 'monthly_messages', 'monthlyMessages');
    mergeUserRowsGlobal(yearlyMessagesRows, 'yearly_messages', 'yearlyMessages');
    mergeUserRowsGlobal(totalMessagesRows, 'total_messages', 'totalMessages');

    // 6. Conversion des BigInt en chaînes de caractères
    let usageArray = Object.values(usageMap);
    usageArray = usageArray.map(item => {
      for (const key in item) {
        if (typeof item[key] === 'bigint') {
          item[key] = item[key].toString();
        }
      }
      return item;
    });

    return NextResponse.json(usageArray);

  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
