export const MZ_GROWTH_PAIN_AUDIO_ID = '1CUWhiKdlMukbzKmkTrNL55xD2bb5Hjf7'
export const MZ_GROWTH_PAIN_YOUTUBE_ID = '8be9oUjoFy0'

export const MZ_GROWTH_PAIN = {
  title: '꿈은 대체 안 돼',
  titleEn: "Dreams Can't Be Replaced",
  series: 'MZ 성장통 2탄',
  slug: 'mz-growth-pain',
  audioHref: `/api/drive?id=${MZ_GROWTH_PAIN_AUDIO_ID}`,
  youtubeWatchHref: `https://www.youtube.com/watch?v=${MZ_GROWTH_PAIN_YOUTUBE_ID}`,
  youtubeEmbedHref: `https://www.youtube-nocookie.com/embed/${MZ_GROWTH_PAIN_YOUTUBE_ID}?rel=0`,
  thumbnailHref: `https://i.ytimg.com/vi/${MZ_GROWTH_PAIN_YOUTUBE_ID}/maxresdefault.jpg`,
  lastUpdated: '2026.09.29',
  introduction:
    '집값과 스펙 경쟁을 견디며 결혼과 청춘을 미뤄온 세대가, 신입 채용의 문과 AI 대체 불안 앞에서도 살아온 시간만큼은 복제할 수 없다고 노래하는 MZ 성장통 앤섬입니다.',
  emotionalArc: [
    '스펙·청약·월세가 한 화면에 겹치는 압박',
    '경력부터 요구하는 신입 채용과 AI 대체 불안',
    '실패·돌봄·질문·다시 일어선 시간이 나를 만든다는 전환',
    '문이 닫혀도 다른 문을 그리겠다는 조용한 희망',
  ],
  production: {
    model: 'YuE2-3B + YuE2-Vae',
    hardware: 'NVIDIA DGX Spark GB10',
    generationMode: 'cot="full"',
    seed: '26092202',
    targetTempo: '약 92 BPM',
    actualTempo: '90 BPM',
    targetKey: 'E minor',
    actualKey: 'B♭ major',
    duration: '199.638667초 (약 3분 19.64초)',
    sourceAudio: '48kHz 스테레오 FLAC',
    deliveryAudio: '48kHz 스테레오 MP3 · 320kbps · peak -0.8dB',
    status: 'complete',
    truncation: 'ABC·semantic 모두 없음',
    generationTime: '약 310.7초',
    score: '102마디 안팎의 YuE2 계획 악보를 거쳐 합성',
    validation: 'ffprobe·volumedetect로 길이, 샘플레이트, 채널, 전달본 peak를 확인',
  },
  stylePrompt:
    'Modern Korean hip-hop with melodic boom-bap and alternative R&B textures, around 92 BPM in E minor, late-night urban mood that begins anxious and intimate and gradually opens into restrained hope. Young Korean male lead with clear conversational rhythmic rap in the verses, a slightly husky melodic vocal in the pre-choruses, and a warm memorable singalong hook. Use dusty punchy drums, rounded sub bass, muted electric piano, low analog synth pads, sparse clean guitar harmonics, subtle room ambience, and a brighter layered lift in the final chorus. Start with a minimal desk-at-dawn atmosphere, build tension through the verses about credentials, rent, housing prices, marriage postponed, closed entry-level hiring, and AI replacement anxiety. Let the chorus widen without becoming triumphant, keeping the groove human and head-nodding. Strip down to piano and breath for the bridge, then return with fuller drums and gentle backing vocals. Contemporary, cinematic, emotionally honest, stylish but not flashy. Korean pronunciation must be clear with natural breaths between phrases. No imitation of any specific artist or song, no EDM drop, no rock guitars, no orchestral ballad, no mumble rap, no excessive autotune, no comedy tone.',
  lyrics: [
    {
      title: 'Intro',
      lines: [
        '알림은 꺼, 이번엔 이력서를 덮어',
        '새벽 네 시, 아직 꿈은 안 자',
      ],
    },
    {
      title: 'Verse 1',
      lines: [
        '졸업장 옆에 자격증을 세워',
        '내일의 나를 위해 오늘을 접어',
        '청약 화면 숫자는 또 멀어지고',
        '월급은 오르기 전에 월세가 먼저 뛰어',
        '친구들 청첩장, 나는 축하를 보내',
        '내 결혼은 다음 계절, 다음 생에?',
        '혼자 사는 법부터 배우면 된다고',
        '작은 방 한 칸에 내 청춘을 접어 넣어',
      ],
    },
    {
      title: 'Pre-Chorus 1',
      lines: [
        '경력 삼 년 이상, 신입 공고 밑에',
        '첫 페이지도 못 넘기고 커서를 멈춰 세워',
        '빠르게 변한 세상, 나만 느린 걸까',
        '아니, 아직 시작도 안 한 거야',
      ],
    },
    {
      title: 'Chorus 1',
      lines: [
        '꿈은 대체 안 돼, 나를 복사할 순 없어',
        '내가 흘린 밤과 다시 일어난 아침',
        '누가 대신 살아 줄 수 있겠어',
        '문이 닫혀도 나는 여기 있어',
        '꿈은 대체 안 돼, 내 시간은 지워지지 않아',
        'A I 가 내 자리를 바꿔 놓아도',
        '사람의 마음까지 대신할 순 없어',
        '늦어도 좋아, 아직 끝난 건 아냐',
      ],
    },
    {
      title: 'Verse 2',
      lines: [
        '새로 뜬 기사엔 또 자동화 소식',
        '내가 외운 기술은 한 줄의 버튼이 되고',
        '면접관의 질문, 무엇을 만들었나요',
        '만든 건 많은데 보여 줄 자리가 없죠',
        '스펙을 쌓느라 놓친 건 없는지',
        '사랑도 여행도 나중으로 미뤘지',
        '살아남으려 나를 계속 업데이트해',
        '그런데 세상은 새 버전만 원해',
      ],
    },
    {
      title: 'Pre-Chorus 2',
      lines: [
        '불안은 밤마다 조용히 로그인해',
        '내 이름 옆에 대체 가능을 적어 놔',
        '그래도 실패한 만큼 질문이 남아',
        '그 질문이 나를 앞으로 밀어',
      ],
    },
    {
      title: 'Chorus 2',
      lines: [
        '꿈은 대체 안 돼, 나를 복사할 순 없어',
        '내가 흘린 밤과 다시 일어난 아침',
        '누가 대신 살아 줄 수 있겠어',
        '문이 닫혀도 나는 여기 있어',
        '꿈은 대체 안 돼, 내 시간은 지워지지 않아',
        'A I 가 내 자리를 바꿔 놓아도',
        '사람의 마음까지 대신할 순 없어',
        '늦어도 좋아, 아직 끝난 건 아냐',
      ],
    },
    {
      title: 'Bridge',
      lines: [
        '스펙만으로 나를 설명할 수 없어',
        '넘어진 자리에서 배운 방향이 있어',
        '누군가의 아픔을 알아본 목소리',
        '혼자 버틴 날들이 만든 온기',
        '다 가진 건 아니어도, 다시 켤 불은 있어',
        '오늘의 작은 용기가 내일의 문이 돼',
      ],
    },
    {
      title: 'Final Chorus',
      lines: [
        '꿈은 대체 안 돼, 나를 복사할 순 없어',
        '내가 흘린 밤과 다시 일어난 아침',
        '신입을 안 뽑아도 길은 내가 찾을게',
        '닫힌 문 앞에서 다른 문을 그릴게',
        '꿈은 대체 안 돼, 우리 시간은 지워지지 않아',
        'A I 가 세상을 바꿔 놓아도',
        '서로의 손을 잡는 일은 남아 있어',
        '늦어도 좋아, 우리는 아직 시작이야',
      ],
    },
    {
      title: 'Outro',
      lines: [
        '작은 방 불을 켜, 오늘도 살아냈어',
        '대체 안 되는 이름으로',
        '내일을 다시 써',
      ],
    },
  ],
  timeline: [
    {
      label: '기획',
      text: '집값·스펙·신입 채용·AI 대체 불안을 한 곡의 감정선으로 묶고, 마지막에는 성공 신화 대신 조용한 재시작을 남겼습니다.',
    },
    {
      label: '생성',
      text: 'YuE2-3B에 한국어 가사와 스타일 프롬프트를 넣고 seed 26092202, cot="full"로 한 번 생성했습니다.',
    },
    {
      label: '검증',
      text: '결과 상태 complete, ABC·semantic truncation 없음, 약 3분 19.64초, 48kHz 스테레오로 확인했습니다.',
    },
    {
      label: '공개',
      text: '뮤직비디오는 MelodyPie90S YouTube에 연결하고, 청취용 MP3는 Google Drive에 두었습니다. Vercel에는 음원 파일을 저장하지 않습니다.',
    },
  ],
  notes: [
    '가사 입력에서는 AI를 발음 안정성을 위해 “A I”로 분리했습니다.',
    '스타일 프롬프트의 목표는 E minor·약 92 BPM이었지만, 실제 계획 악보는 Q:1/4=90·K:B♭로 출력되었습니다. 목표와 결과를 구분해 기록합니다.',
    '자동 검증은 기술 필터이고, 최종 음악적 평가는 직접 청취로 판단합니다.',
  ],
  links: {
    research: '/research/yue2-3b-symbolic-music-generation-autumn-chanson',
    musicShowcase: '/demos/music',
  },
} as const
