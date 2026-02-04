import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // 跨域配置
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_GITHUB_PAGES_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 仅允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  try {
    const { name, phone } = req.body;

    // 校验必填字段
    if (!name || !phone) {
      return res.status(400).json({ error: '姓名和电话为必填项' });
    }

    // 校验电话格式（简单校验，可根据需求调整）
    const phoneReg = /^1[3-9]\d{9}$/; // 国内手机号正则
    if (!phoneReg.test(phone)) {
      return res.status(400).json({ error: '请输入有效的手机号' });
    }

    // 写入 Supabase 数据库
    const { data, error } = await supabase
      .from('user_info')
      .insert([{ name, phone }])
      .select();

    if (error) {
      // 捕获电话重复的错误
      if (error.message.includes('unique constraint')) {
        return res.status(409).json({ error: '该手机号已注册' });
      }
      throw new Error(error.message);
    }

    // 注册成功
    return res.status(200).json({
      success: true,
      message: '注册成功',
      user: data[0] // 返回注册的用户信息
    });

  } catch (err) {
    return res.status(500).json({ error: `服务器错误：${err.message}` });
  }
}