-- JSON 데이터로부터 auth_code_apps와 auth_code_contents 테이블에 데이터를 삽입하는 프로시저
CREATE OR REPLACE FUNCTION migrate_legacy_auth_code_data(
  legacy_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_code_id UUID;
  v_app_id INTEGER;
  v_content_id INTEGER;
  v_available_apps TEXT[];
  v_available_contents TEXT[];
  v_result JSONB;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 트랜잭션 시작
  BEGIN
    -- legacy_data에서 auth_code_id 가져오기
    v_auth_code_id := (legacy_data->>'id')::UUID;
    
    -- available_apps를 배열로 변환 (쉼표로 구분된 문자열 또는 JSON 배열 처리)
    IF jsonb_typeof(legacy_data->'available_apps') = 'array' THEN
      -- JSON 배열인 경우
      SELECT array_agg(x::TEXT)
      INTO v_available_apps
      FROM jsonb_array_elements_text(legacy_data->'available_apps') x;
    ELSIF (legacy_data->>'available_apps') IS NOT NULL THEN
      -- 쉼표로 구분된 문자열인 경우
      v_available_apps := string_to_array(legacy_data->>'available_apps', ',');
    END IF;

    -- available_contents를 배열로 변환
    IF jsonb_typeof(legacy_data->'available_contents') = 'array' THEN
      -- JSON 배열인 경우
      SELECT array_agg(x::TEXT)
      INTO v_available_contents
      FROM jsonb_array_elements_text(legacy_data->'available_contents') x;
    ELSIF (legacy_data->>'available_contents') IS NOT NULL THEN
      -- 쉼표로 구분된 문자열인 경우
      v_available_contents := string_to_array(legacy_data->>'available_contents', ',');
    END IF;

    -- available_apps 처리
    IF v_available_apps IS NOT NULL THEN
      FOREACH v_app_id IN ARRAY (
        SELECT ARRAY_AGG(app_id::INTEGER) 
        FROM insol_apps 
        WHERE app_id::TEXT = ANY(v_available_apps)
      )
      LOOP
        BEGIN
          INSERT INTO auth_code_apps (auth_code_id, app_id)
          VALUES (v_auth_code_id, v_app_id)
          ON CONFLICT (auth_code_id, app_id) DO NOTHING;
          
          v_success_count := v_success_count + 1;
        EXCEPTION WHEN OTHERS THEN
          v_errors := array_append(v_errors, format('앱 ID %s 처리 중 오류: %s', v_app_id, SQLERRM));
          v_error_count := v_error_count + 1;
        END;
      END LOOP;
    END IF;

    -- available_contents 처리
    IF v_available_contents IS NOT NULL THEN
      FOREACH v_content_id IN ARRAY (
        SELECT ARRAY_AGG(id::INTEGER)
        FROM insol_contents
        WHERE id::TEXT = ANY(v_available_contents)
      )
      LOOP
        BEGIN
          INSERT INTO auth_code_contents (auth_code_id, content_id)
          VALUES (v_auth_code_id, v_content_id)
          ON CONFLICT (auth_code_id, content_id) DO NOTHING;
          
          v_success_count := v_success_count + 1;
        EXCEPTION WHEN OTHERS THEN
          v_errors := array_append(v_errors, format('콘텐츠 ID %s 처리 중 오류: %s', v_content_id, SQLERRM));
          v_error_count := v_error_count + 1;
        END;
      END LOOP;
    END IF;

    -- 결과 생성
    SELECT jsonb_build_object(
      'auth_code_id', v_auth_code_id,
      'success_count', v_success_count,
      'error_count', v_error_count,
      'errors', to_jsonb(v_errors)
    ) INTO v_result;

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    -- 오류 발생 시 롤백은 자동으로 처리됨
    RAISE EXCEPTION '마이그레이션 중 오류 발생: %', SQLERRM;
  END;
END;
$$;

-- 여러 인증 코드 데이터를 한 번에 마이그레이션하는 프로시저
CREATE OR REPLACE FUNCTION migrate_legacy_auth_codes(
  legacy_data_array JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_results JSONB[] := ARRAY[]::JSONB[];
  v_total_success INTEGER := 0;
  v_total_error INTEGER := 0;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(legacy_data_array)
  LOOP
    DECLARE
      v_result JSONB;
    BEGIN
      v_result := migrate_legacy_auth_code_data(v_item);
      v_results := array_append(v_results, v_result);
      v_total_success := v_total_success + (v_result->>'success_count')::INTEGER;
      v_total_error := v_total_error + (v_result->>'error_count')::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      v_results := array_append(v_results, jsonb_build_object(
        'auth_code_id', v_item->>'id',
        'error', SQLERRM
      ));
      v_total_error := v_total_error + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'total_success', v_total_success,
    'total_error', v_total_error,
    'results', to_jsonb(v_results)
  );
END;
$$;

-- 사용 예시:
/*
SELECT migrate_legacy_auth_codes('[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "available_apps": ["1", "2", "3"],
    "available_contents": ["1", "2", "3", "4"]
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "available_apps": "1,2,3",
    "available_contents": "1,2,3,4"
  }
]');
*/ 