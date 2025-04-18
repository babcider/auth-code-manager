CREATE OR REPLACE FUNCTION create_auth_code_with_contents(
  auth_code_data JSONB,
  content_ids TEXT[] DEFAULT '{}',
  app_ids INTEGER[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_code_id UUID;
  v_result JSONB;
  v_content_id INTEGER;
  v_app_id INTEGER;
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
      (auth_code_data->>'expire_time')::TIMESTAMP WITH TIME ZONE
    )
    RETURNING id INTO v_auth_code_id;

    -- content_ids 처리
    IF array_length(content_ids, 1) > 0 THEN
      FOREACH v_content_id IN ARRAY (SELECT ARRAY_AGG((unnest)::INTEGER) FROM unnest(content_ids))
      LOOP
        INSERT INTO auth_code_contents (auth_code_id, content_id, created_at)
        VALUES (v_auth_code_id, v_content_id, NOW());
      END LOOP;
    END IF;

    -- app_ids 처리
    IF array_length(app_ids, 1) > 0 THEN
      FOREACH v_app_id IN ARRAY app_ids
      LOOP
        INSERT INTO auth_code_apps (auth_code_id, app_id)
        VALUES (v_auth_code_id, v_app_id);
      END LOOP;
    END IF;

    -- 결과 반환
    v_result := jsonb_build_object(
      'success', true,
      'auth_code_id', v_auth_code_id
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM
      );
      RETURN v_result;
  END;
END;
$$; 