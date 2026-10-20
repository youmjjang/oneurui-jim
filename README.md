# 오늘의 짐 🧳

가까운 보관함과 일정에 맞는 보관함을 비교하는 웹 데모입니다.

## 현재 기능
- 바로 맡기기 / 일정에 맞추기
- 짐 크기, 보관 시각, 가상 비용 및 전체 이동시간 비교
- 보관함 비교함과 일정 복사

현재 시설·요금·지도·경로는 **가상 예시**이며 공공데이터나 카카오 API에 연결되어 있지 않습니다. 빈자리·예약 기능도 없습니다.

## 로컬 실행
Node.js 24에서 npm run dev 실행 후 http://127.0.0.1:4173 접속. npm test로 비교 로직 검증.

## Vercel 배포
Vercel의 Add New Project에서 이 저장소를 Import합니다. Framework Preset은 Other, Build Command는 npm run build, Output Directory는 dist입니다. vercel.json에도 설정되어 있습니다.

## API 키
실제 연동 시 Vercel 프로젝트 Settings → Environment Variables에 KAKAO_REST_API_KEY 및 필요한 공공데이터 인증키를 Secret으로 등록합니다. 키를 GitHub나 채팅에 올리지 마세요. .env.example은 빈 양식입니다. 공개 접두사(VITE_, NEXT_PUBLIC_)를 비밀 키에 붙이지 마세요.

서버 함수는 api/ 아래에 둡니다. 현재 api/health.js는 키 값 없이 설정 여부만 알려주는 준비용 엔드포인트입니다. 실제 경로 조회는 아직 구현되지 않았습니다. 지도 JavaScript 키는 별도로 허용 도메인을 제한해 사용합니다.

실제 연동 전에 입력 검증, 호출 제한 및 공공데이터의 지원 항목과 갱신일을 확인해야 합니다.
