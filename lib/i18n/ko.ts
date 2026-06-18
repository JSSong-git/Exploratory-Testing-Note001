/**
 * 탐색적 테스트(Exploratory Testing) UI 용어집
 * - 도메인 우선: 결함, 관찰 기록, 확인 사항 등 QA 표준 용어
 * - 형식명(Markdown, JSON 등)은 영문 유지
 */
import type { AnnotationType } from '@/lib/core/types';

export const TYPE_LABELS: Record<AnnotationType, string> = {
  bug: '결함',
  note: '관찰 기록',
  idea: '개선 아이디어',
  question: '확인 사항',
};

export const CHART_TYPE_LABELS: Record<AnnotationType, string> = {
  bug: '결함',
  note: '관찰 기록',
  idea: '개선 아이디어',
  question: '확인 사항',
};

export function descriptionLabel(type: AnnotationType): string {
  return type === 'bug' ? '결함 정보 (Markdown)' : '상세 설명 (Markdown)';
}

export function titlePlaceholder(type: AnnotationType): string {
  return `${TYPE_LABELS[type]} 제목`;
}

export const ko = {
  app: {
    title: '탐색 세션',
    subtitle: '탐색적 테스트',
    itemCount: (n: number) => `${n}건`,
    loading: '불러오는 중…',
  },
  nav: {
    compose: '기록 작성',
    saved: '저장된 기록',
  },
  form: {
    titleRequired: '제목 (필수)',
    description: '상세 설명',
    bugPlaceholder: '재현 절차, 기대 결과와 실제 결과, 기타 메모…',
    editing: '기록 수정 중',
    noDescription: '상세 설명 없음',
    noSaved: '저장된 기록이 없습니다.',
  },
  actions: {
    review: '저장 전 검토',
    update: '수정',
    cancelEdit: '수정 취소',
    captureFull: '전체 캡처',
    captureCrop: '영역 캡처',
    captureFullAria: '전체 화면 캡처',
    captureCropAria: '화면 영역 선택 캡처',
    back: '← 뒤로',
    edit: '수정',
    delete: '삭제',
    reviewTitle: '저장 전 검토',
    backToEdit: '수정으로 돌아가기',
    confirmSave: '저장 확인',
    previewReport: '리포트 미리보기',
    export: '보내기',
    import: '가져오기',
    resetSession: '세션 초기화',
    more: '더보기',
    save: '저장',
    cancel: '취소',
    confirmAnnotation: '기록 저장 확인',
    screenshotPreview: '스크린샷 미리보기',
  },
  export: {
    markdown: 'Markdown (.zip)',
    markdownInline: 'Markdown inline (.md)',
    json: 'JSON',
    csv: 'CSV',
    html: 'Standalone HTML',
    default: '기본',
  },
  report: {
    title: '세션 리포트',
    started: (date: string) => `시작 ${date}`,
    all: '전체',
    searchPlaceholder: '제목, 상세 설명, URL 검색',
    colType: '유형',
    colTitle: '제목',
    colDescription: '상세 설명',
    colUrl: 'URL',
    colScreenshot: '스크린샷',
    colTime: '기록 시각',
    empty: '현재 필터에 맞는 기록이 없습니다.',
    noData: '세션 데이터를 불러올 수 없습니다.',
    loading: '리포트를 불러오는 중…',
  },
  editor: {
    edit: '편집',
    preview: '미리보기',
    hint: '**굵게** · - 목록 · `코드` · ## 제목',
    emptyPreview: '미리보기할 내용이 없습니다.',
    writePlaceholder: 'Markdown으로 작성…',
    tools: {
      arrow: '화살표',
      rectangle: '사각형',
      text: '텍스트',
      blur: '모자이크',
      undo: '실행 취소',
      save: '저장',
      cancel: '취소',
    },
  },
  errors: {
    titleRequired: '제목을 입력해 주세요.',
    titleRequiredBeforeCrop: '영역 캡처 전에 제목을 입력해 주세요.',
    saveFailed: '저장에 실패했습니다.',
    deleteFailed: '삭제에 실패했습니다.',
    exportFailed: '보내기에 실패했습니다.',
    importFailed: '가져오기에 실패했습니다.',
    screenshotFailed: '스크린샷 캡처에 실패했습니다.',
    cropFailed: '영역 캡처를 시작할 수 없습니다.',
  },
  confirm: {
    delete: '이 기록을 삭제할까요?',
    resetSession:
      '현재 탐색 세션을 초기화할까요? 저장된 기록이 모두 삭제됩니다.',
  },
  image: {
    loading: '이미지 불러오는 중…',
    unavailable: '이미지를 불러올 수 없습니다.',
    hasScreenshot: '스크린샷 있음',
  },
} as const;
