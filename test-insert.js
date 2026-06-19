import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const newCard = {
    title: 'Test Card',
    type: 'note',
    raw_content: 'Test content',
    summary: 'Test summary',
    use_this_when: ['Uncategorized'],
    tags: ['Uncategorized'],
    tabs: [],
    status: 'saved',
    use_count: 0
  };
  const { data, error } = await supabase.from('cards').insert([newCard]).select();
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
