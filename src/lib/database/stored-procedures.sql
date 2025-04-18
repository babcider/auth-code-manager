CREATE OR REPLACE FUNCTION create_auth_code_with_contents(
  auth_code_data JSONB,
  content_ids TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_code_id UUID;
  v_result JSONB;
  v_content_id INTEGER;
BEGIN
  -- 트랜잭션 시작
  BEGIN
    -- auth_codes 테이블에 데이터 삽입
    INSERT INTO auth_codes (
      key,
      is_active,
      is_unlimit,
      create_time,
      setup_key,
      unity_key,
      institution_name,
      agency,
      memo,
      program_update,
      local_max_count,
      available_apps,
      available_contents,
      expire_time
    ) VALUES (
      (auth_code_data->>'key')::TEXT,
      (auth_code_data->>'is_active')::BOOLEAN,
      (auth_code_data->>'is_unlimit')::BOOLEAN,
      COALESCE((auth_code_data->>'create_time')::TIMESTAMP WITH TIME ZONE, NOW()),
      (auth_code_data->>'setup_key')::TEXT,
      (auth_code_data->>'unity_key')::TEXT,
      (auth_code_data->>'institution_name')::TEXT,
      (auth_code_data->>'agency')::TEXT,
      (auth_code_data->>'memo')::TEXT,
      (auth_code_data->>'program_update')::TEXT,
      (auth_code_data->>'local_max_count')::INTEGER,
      (auth_code_data->>'available_apps')::TEXT,
      (auth_code_data->>'available_contents')::TEXT,
      (auth_code_data->>'expire_time')::TIMESTAMP WITH TIME ZONE
    )
    RETURNING id INTO v_auth_code_id;

    -- content_ids가 있는 경우 auth_code_contents 테이블에 데이터 삽입
    IF array_length(content_ids, 1) > 0 THEN
      FOREACH v_content_id IN ARRAY (SELECT ARRAY_AGG((unnest)::INTEGER) FROM unnest(content_ids))
      LOOP
        INSERT INTO auth_code_contents (auth_code_id, content_id, created_at)
        VALUES (v_auth_code_id, v_content_id, NOW());
      END LOOP;
    END IF;

    -- 결과 생성
    SELECT jsonb_build_object(
      'id', v_auth_code_id,
      'key', (auth_code_data->>'key'),
      'is_active', (auth_code_data->>'is_active')::BOOLEAN,
      'is_unlimit', (auth_code_data->>'is_unlimit')::BOOLEAN,
      'create_time', COALESCE((auth_code_data->>'create_time')::TIMESTAMP WITH TIME ZONE, NOW()),
      'content_ids', content_ids
    ) INTO v_result;

    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- 오류 발생 시 롤백은 자동으로 처리됨
      RAISE EXCEPTION 'Failed to create auth code: %', SQLERRM;
  END;
END;
$$; 