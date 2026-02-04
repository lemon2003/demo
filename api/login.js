import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // 跨域配置
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_GITHUB_PAGES_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: '姓名和电话为必填项' });
    }

    // 查询数据库：验证姓名和电话是否匹配
    const { data, error } = await supabase
      .from('user_info')
      .select('*')
      .eq('phone', phone) // 先按电话查
      .eq('name', name)   // 再匹配姓名
      .single(); // 只返回一条结果

    if (error) {
      // 无匹配数据时返回登录失败
      if (error.code === 'PGRST116') {
        return res.status(401).json({ error: '姓名或电话错误，登录失败' });
      }
      throw new Error(error.message);
    }

    // 登录成功
    return res.status(200).json({
      success: true,
      message: '登录成功',
      user: {
        name: data.name,
        phone: data.phone,
        id: data.id
      }
    });

  } catch (err) {
    return res.status(500).json({ error: `服务器错误：${err.message}` });
  }
}