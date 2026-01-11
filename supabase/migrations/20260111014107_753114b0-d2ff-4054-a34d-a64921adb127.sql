-- Create a trigger function to validate comment content (server-side profanity filter)
CREATE OR REPLACE FUNCTION check_comment_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for forbidden words (German and English)
  IF NEW.content ~* '(arschloch|scheiße|scheisse|fick|ficken|hurensohn|wichser|missgeburt|behindert|spast|schwuchtel|fotze|hure|nutte|vollidiot|penner|assi|fuck|shit|bitch|asshole|bastard|dick|pussy|cunt|retard|nigger|faggot)' THEN
    RAISE EXCEPTION 'Comment contains inappropriate language';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for comment validation
CREATE TRIGGER validate_comment_content
  BEFORE INSERT OR UPDATE ON anime_comments
  FOR EACH ROW
  EXECUTE FUNCTION check_comment_content();