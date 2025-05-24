-- Function to get the latest metrics for each hive
-- This function returns only the most recent metric record for each hive
-- which significantly reduces the data transfer for dashboard display

CREATE OR REPLACE FUNCTION get_latest_metrics_for_dashboard()
RETURNS TABLE (
  hive_id TEXT,
  metric_timestamp TIMESTAMPTZ,
  temp_value NUMERIC,
  hum_value NUMERIC,
  sound_value NUMERIC,
  weight_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_timestamps AS (
    SELECT DISTINCT ON (hive_id) 
      hive_id,
      timestamp
    FROM metrics_time_series_data
    ORDER BY hive_id, timestamp DESC
  )
  SELECT 
    m.hive_id,
    m.timestamp,
    m.temp_value,
    m.hum_value,
    m.sound_value,
    m.weight_value
  FROM metrics_time_series_data m
  JOIN latest_timestamps lt ON m.hive_id = lt.hive_id AND m.timestamp = lt.timestamp
  ORDER BY m.hive_id;
END;
$$ LANGUAGE plpgsql; 