const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const body = JSON.parse(event.body);
  const { action, employee_name, memory, knowledge, admin_key } = body;

  if (action === 'get_memory') {
    const { data } = await supabase
      .from('employee_memory')
      .select('memory')
      .eq('name', employee_name)
      .single();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ memory: data?.memory || '' })
    };
  }

  if (action === 'save_memory') {
    await supabase
      .from('employee_memory')
      .upsert({ name: employee_name, memory, updated_at: new Date() }, { onConflict: 'name' });
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true })
    };
  }

  if (action === 'get_knowledge') {
    const { data } = await supabase
      .from('knowledge_base')
      .select('content, created_at')
      .order('created_at', { ascending: true });
    const combined = data && data.length > 0
      ? data.map(r => r.content).join('\n\n')
      : '';
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ content: combined })
    };
  }

  if (action === 'add_knowledge') {
    if (admin_key !== process.env.ADMIN_KEY) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    await supabase
      .from('knowledge_base')
      .insert({ content: knowledge, created_at: new Date() });
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true })
    };
  }

  return { statusCode: 400, body: 'Unknown action' };
};
