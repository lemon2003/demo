// 删掉原来的 import 语句
const { createClient } = (() => {
  const supabaseCdnUrl = 'https://esm.sh/@supabase/supabase-js@2';
  return eval(`import('${supabaseCdnUrl}')`);
})();

export default async function handler(req, res) {
  // 跨域配置（不变）
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

    // 初始化客户端
    const supabase = await createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('user_info')
      .select('*')
      .eq('phone', phone)
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(401).json({ error: '姓名或电话错误，登录失败' });
      }
      throw new Error(error.message);
    }

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
