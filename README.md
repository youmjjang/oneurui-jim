# 오늘의 짐

보관함 위치와 짐 회수까지의 동선을 비교하는 웹 서비스.

현재 화면 구성 완료, 실제 데이터 연동 준비 중입니다. 가상 시설·요금·경로 데이터는 제거했습니다.

## 실행
Node.js 24에서 npm run dev. Vercel은 Other / npm run build / dist 설정.

## 연동 준비
- 카카오맵 JavaScript 키: 허용 웹 도메인 등록
- KAKAO_REST_API_KEY: Vercel 서버 환경변수에 Secret으로 저장
- 공공 보관함 데이터: 원본 파일 또는 API의 위치·규격·운영정보 확인 후 연결

키를 GitHub나 채팅에 올리지 마세요. .env.example은 빈 양식입니다.
