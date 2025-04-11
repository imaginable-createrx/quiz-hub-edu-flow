
-- Function to get a profile by ID
CREATE OR REPLACE FUNCTION public.get_profile_by_id(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT, 
  role TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT id, name, role FROM public.profiles WHERE id = user_id;
$$;

-- Function to get tests with their files
CREATE OR REPLACE FUNCTION public.get_tests_with_files()
RETURNS TABLE (
  id UUID, 
  title TEXT, 
  description TEXT, 
  num_questions INTEGER,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ,
  created_by UUID,
  file_path TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    t.id, 
    t.title, 
    t.description, 
    t.num_questions,
    t.duration_minutes,
    t.created_at,
    t.created_by,
    (SELECT tf.file_path FROM public.test_files tf WHERE tf.test_id = t.id LIMIT 1) as file_path
  FROM 
    public.tests t
  ORDER BY 
    t.created_at DESC;
$$;

-- Function to get submissions with their answer images
CREATE OR REPLACE FUNCTION public.get_submissions_with_answers(current_user_id UUID, is_student BOOLEAN)
RETURNS TABLE (
  id UUID,
  test_id UUID,
  student_id UUID,
  submitted_at TIMESTAMPTZ,
  score FLOAT,
  feedback TEXT,
  graded BOOLEAN,
  answer_images JSON
) 
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, 
    s.test_id,
    s.student_id,
    s.submitted_at,
    s.score,
    s.feedback,
    s.graded,
    (
      SELECT 
        COALESCE(
          json_agg(
            json_build_object(
              'question_number', ai.question_number,
              'image_path', ai.image_path
            )
          ),
          '[]'::json
        )
      FROM 
        public.answer_images ai
      WHERE 
        ai.submission_id = s.id
    ) as answer_images
  FROM 
    public.submissions s
  WHERE 
    (is_student = false) OR (s.student_id = current_user_id)
  ORDER BY 
    s.submitted_at DESC;
END;
$$;

-- Function to insert a test file
CREATE OR REPLACE FUNCTION public.insert_test_file(
  p_test_id UUID,
  p_file_path TEXT,
  p_file_name TEXT
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.test_files (test_id, file_path, file_name)
  VALUES (p_test_id, p_file_path, p_file_name);
END;
$$;

-- Function to insert an answer image
CREATE OR REPLACE FUNCTION public.insert_answer_image(
  p_submission_id UUID,
  p_question_number INTEGER,
  p_image_path TEXT
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.answer_images (submission_id, question_number, image_path)
  VALUES (p_submission_id, p_question_number, p_image_path);
END;
$$;

-- Function to insert a test
CREATE OR REPLACE FUNCTION public.insert_test(
  p_title TEXT,
  p_description TEXT,
  p_duration_minutes INTEGER,
  p_num_questions INTEGER,
  p_created_by UUID
)
RETURNS TABLE (id UUID)
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.tests (title, description, duration_minutes, num_questions, created_by)
  VALUES (p_title, p_description, p_duration_minutes, p_num_questions, p_created_by)
  RETURNING tests.id INTO v_id;
  
  RETURN QUERY SELECT v_id;
END;
$$;

-- Function to insert a submission
CREATE OR REPLACE FUNCTION public.insert_submission(
  p_test_id UUID,
  p_student_id UUID
)
RETURNS TABLE (id UUID)
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.submissions (test_id, student_id)
  VALUES (p_test_id, p_student_id)
  RETURNING submissions.id INTO v_id;
  
  RETURN QUERY SELECT v_id;
END;
$$;

-- Function to grade a submission
CREATE OR REPLACE FUNCTION public.grade_submission(
  p_submission_id UUID,
  p_score FLOAT,
  p_feedback TEXT
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.submissions
  SET 
    score = p_score,
    feedback = p_feedback,
    graded = true
  WHERE id = p_submission_id;
END;
$$;

-- Function to delete a test with all related files and submissions
CREATE OR REPLACE FUNCTION public.delete_test_complete(
  p_test_id UUID
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Delete all answer images related to submissions for this test
  FOR file_record IN (
    SELECT ai.image_path, ai.id
    FROM answer_images ai
    JOIN submissions s ON s.id = ai.submission_id
    WHERE s.test_id = p_test_id
  ) LOOP
    -- Note: The actual file deletion from storage should be handled in the application code
    DELETE FROM answer_images 
    WHERE id = file_record.id;
  END LOOP;
  
  -- Delete all submissions for this test
  DELETE FROM submissions WHERE test_id = p_test_id;
  
  -- Get test files before deleting them (for storage cleanup)
  FOR file_record IN (
    SELECT file_path, id
    FROM test_files 
    WHERE test_id = p_test_id
  ) LOOP
    -- Delete file records
    DELETE FROM test_files WHERE id = file_record.id;
  END LOOP;
  
  -- Finally delete the test itself
  DELETE FROM tests WHERE id = p_test_id;
  
  RETURN FOUND;
END;
$$;

-- Function to delete a task with all related submissions
CREATE OR REPLACE FUNCTION public.delete_task_complete(
  p_task_id UUID
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Get task submissions for file cleanup
  FOR file_record IN (
    SELECT attachment_url, id
    FROM task_submissions
    WHERE task_id = p_task_id
  ) LOOP
    -- Delete task submission record
    DELETE FROM task_submissions WHERE id = file_record.id;
  END LOOP;
  
  -- Delete the task itself
  DELETE FROM tasks WHERE id = p_task_id;
  
  RETURN FOUND;
END;
$$;
