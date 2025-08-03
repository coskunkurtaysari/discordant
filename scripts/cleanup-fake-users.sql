-- Sahte kullanıcıları temizleme script'i

-- Önce sahte kullanıcılarla ilgili arkadaşlık kayıtlarını sil
DELETE FROM friend 
WHERE userId IN (
  SELECT userId FROM profile 
  WHERE name LIKE 'Sahte Kullanıcı%'
) OR friendId IN (
  SELECT userId FROM profile 
  WHERE name LIKE 'Sahte Kullanıcı%'
);

-- Sonra sahte kullanıcıları sil
DELETE FROM profile 
WHERE name LIKE 'Sahte Kullanıcı%';

-- Temizlik sonrası kontrol
SELECT 'Profile tablosu:' as info;
SELECT id, name, email FROM profile;

SELECT 'Friend tablosu:' as info;
SELECT id, userId, friendId FROM friend; 