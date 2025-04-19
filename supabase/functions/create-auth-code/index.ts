import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';

interface CodeGenerationOptions {
  key: string;
  is_active: boolean;
  is_unlimit: boolean;
  setup_key?: string;
  unity_key?: string;
  institution_name?: string;
  agency?: string;
  memo?: string;
  program_update?: string;
  local_max_count?: number;
  available_apps?: string;
  available_contents?: string;
  expire_time?: string;
  content_ids?: number[];
}

interface RequestBody {
  options: CodeGenerationOptions;
}

const SUPABASE_URL = 'https://cfdwfviygafenvvzudzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZHdmdml5Z2FmZW52dnp1ZHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MzA2NjksImV4cCI6MjA2MDEwNjY2OX0.XCxCeCGW9C0hPrn60eIyj5HxVRB3E6NEI8TfQnOxGOI';

serve(async (req: Request) => {
  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { options } = await req.json() as RequestBody;
    const currentTime = new Date().toISOString();

    // 1. auth_codes 테이블에 데이터 삽입
    const { data: authCode, error: authError } = await supabaseClient
      .from('auth_codes')
      .insert({
        key: options.key,
        is_active: options.is_active,
        is_unlimit: options.is_unlimit,
        create_time: currentTime,
        setup_key: options.setup_key,
        unity_key: options.unity_key,
        institution_name: options.institution_name,
        agency: options.agency,
        memo: options.memo,
        program_update: options.program_update,
        local_max_count: options.local_max_count,
        available_apps: options.available_apps,
        available_contents: options.available_contents,
        expire_time: options.expire_time
      })
      .select()
      .single();

    if (authError) {
      throw new Error(`인증 코드 생성 실패: ${authError.message}`);
    }

    // 2. content_ids 처리
    if (options.content_ids?.length) {
      const contentData = options.content_ids.map(contentId => ({
        auth_code_id: authCode.id,
        content_id: contentId,
        created_at: currentTime
      }));

      const { error: contentError } = await supabaseClient
        .from('auth_code_contents')
        .insert(contentData);

      if (contentError) {
        // 롤백
        await supabaseClient
          .from('auth_codes')
          .delete()
          .eq('id', authCode.id);
        
        throw new Error(`콘텐츠 연결 실패: ${contentError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: authCode }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}); 