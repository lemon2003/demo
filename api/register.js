// 删掉原来的 import 语句：import { createClient } from '@supabase/supabase-js';

// 新增：通过 CDN 加载 Supabase 客户端（无需安装依赖）
const { createClient } = (() => {
  const supabaseCdnUrl = 'https://esm.sh/@supabase/supabase-js@2';
  return eval(`import('${supabaseCdnUrl}')`);
})();

// 初始化 Supabase 客户端（后面的代码不变）
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

    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      return res.status(400).json({ error: '请输入有效的手机号' });
    }

    // 初始化客户端（移到这里，确保 CDN 加载完成）
    const supabase = await createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('user_info')
      .insert([{ name, phone }])
      .select();

    if (error) {
      if (error.message.includes('unique constraint')) {
        return res.status(409).json({ error: '该手机号已注册' });
      }
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      message: '注册成功',
      user: data[0]
    });

  } catch (err) {
    return res.status(500).json({ error: `服务器错误：${err.message}` });
  }
}
