/**
 * SQL Reference for Restaurant Rating Aggregation
 * 
 * This file shows the equivalent SQL queries being run by the new functions
 * You can use these directly in Supabase SQL Editor for testing
 */

-- =====================================
-- 1. GET RESTAURANT WITH AVERAGE RATING AND REVIEW COUNT
-- =====================================

-- Using a subquery to calculate average rating
SELECT 
  r.id,
  r.name_ru,
  r.name_kk,
  r.banner_url,
  r.is_open,
  r.delivery_time_min,
  r.delivery_time_max,
  r.delivery_fee,
  COALESCE(ROUND(AVG(rv.rating)::numeric, 1), 0) as rating,
  COUNT(rv.id) as review_count
FROM restaurants r
LEFT JOIN reviews rv ON r.id = rv.cafe_id
WHERE r.is_open = true
GROUP BY r.id, r.name_ru, r.name_kk, r.banner_url, r.is_open, 
         r.delivery_time_min, r.delivery_time_max, r.delivery_fee
ORDER BY rating DESC, r.created_at DESC
LIMIT 50;


-- =====================================
-- 2. GET SINGLE RESTAURANT WITH RATINGS
-- =====================================

SELECT 
  r.*,
  COUNT(rv.id) as review_count,
  COALESCE(ROUND(AVG(rv.rating)::numeric, 1), 0) as average_rating
FROM restaurants r
LEFT JOIN reviews rv ON r.id = rv.cafe_id
WHERE r.id = 'restaurant_id_here'
GROUP BY r.id;


-- =====================================
-- 3. GET TOP-RATED RESTAURANTS (sorted by rating)
-- =====================================

SELECT 
  r.id,
  r.name_ru,
  r.name_kk,
  r.banner_url,
  r.is_open,
  COALESCE(ROUND(AVG(rv.rating)::numeric, 1), 0) as rating,
  COUNT(rv.id) as review_count
FROM restaurants r
LEFT JOIN reviews rv ON r.id = rv.cafe_id
WHERE r.is_open = true AND r.city = 'Almaty'
GROUP BY r.id, r.name_ru, r.name_kk, r.banner_url, r.is_open
HAVING COUNT(rv.id) > 0  -- Only restaurants with reviews
ORDER BY rating DESC, review_count DESC;


-- =====================================
-- 4. GET RESTAURANTS BY CUISINE TYPE
-- =====================================

SELECT 
  r.id,
  r.name_ru,
  r.name_kk,
  r.cuisine_types,
  COALESCE(ROUND(AVG(rv.rating)::numeric, 1), 0) as rating,
  COUNT(rv.id) as review_count
FROM restaurants r
LEFT JOIN reviews rv ON r.id = rv.cafe_id
WHERE r.is_open = true AND r.cuisine_types @> ARRAY['Burger']
GROUP BY r.id, r.name_ru, r.name_kk, r.cuisine_types
ORDER BY rating DESC, r.created_at DESC
LIMIT 20;


-- =====================================
-- 5. CREATE A VIEW FOR EASY ACCESS (Optional)
-- =====================================

CREATE OR REPLACE VIEW restaurant_ratings AS
SELECT 
  r.*,
  COALESCE(ROUND(AVG(rv.rating)::numeric, 1), 0) as avg_rating,
  COUNT(rv.id) as total_reviews
FROM restaurants r
LEFT JOIN reviews rv ON r.id = rv.cafe_id
GROUP BY r.id;


-- Then you can simply query:
SELECT * FROM restaurant_ratings 
WHERE is_open = true 
ORDER BY avg_rating DESC 
LIMIT 50;


-- =====================================
-- 6. CREATE RPC FUNCTION (Optional)
-- =====================================

CREATE OR REPLACE FUNCTION get_restaurants_with_ratings(limit_count INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  name_ru TEXT,
  name_kk TEXT,
  is_open BOOLEAN,
  rating NUMERIC,
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name_ru,
    r.name_kk,
    r.is_open,
    COALESCE(ROUND(AVG(rv.rating)::numeric, 1), 0),
    COUNT(rv.id)
  FROM restaurants r
  LEFT JOIN reviews rv ON r.id = rv.cafe_id
  WHERE r.is_open = true
  GROUP BY r.id, r.name_ru, r.name_kk, r.is_open
  ORDER BY COALESCE(ROUND(AVG(rv.rating)::numeric, 1), 0) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


-- Usage:
SELECT * FROM get_restaurants_with_ratings(50);


-- =====================================
-- 7. UPDATE RESTAURANT RATING TRIGGER (Optional)
-- =====================================
-- This would automatically update a cached rating field

CREATE OR REPLACE FUNCTION update_restaurant_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the restaurant's cached rating field when a review is inserted/updated
  UPDATE restaurants 
  SET rating = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM reviews 
    WHERE cafe_id = NEW.cafe_id
  ), 0)
  WHERE id = NEW.cafe_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_restaurant_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_avg_rating();


-- =====================================
-- KEY CONCEPTS
-- =====================================

/*
1. LEFT JOIN: Keeps restaurants even if they have no reviews
   - Restaurants with 0 reviews will show rating = 0

2. COALESCE: Handles NULL values
   - If no reviews: AVG returns NULL, COALESCE converts it to 0

3. GROUP BY: Aggregates multiple review rows into one rating value
   - All review ratings are combined per restaurant

4. ROUND(x::numeric, 1): Rounds to 1 decimal place
   - 4.666... becomes 4.7

5. COUNT(rv.id): Counts how many reviews exist
   - Empty set returns 0, not NULL

6. ORDER BY: Sorts by rating DESC (highest first)

7. LIMIT: Restricts result count for performance
*/
