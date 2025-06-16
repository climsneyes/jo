// DOM 요소
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const saveBtn = document.getElementById('saveBtn');
const uploadBtn = document.getElementById('uploadBtn');
const compareBtn = document.getElementById('compareBtn');
const resultText = document.getElementById('resultText');
const progressBar = document.getElementById('progressBar');
const statusMessage = document.getElementById('statusMessage');
const helpModal = document.getElementById('helpModal');
const helpContent = document.getElementById('helpContent');
const closeModal = document.querySelector('.close');
const pdfFile = document.getElementById('pdfFile');

// API 도움말 내용
const apiHelpContent = {
    gemini: `[Gemini API 키 얻는 방법]

1. Google AI Studio 접속
   - https://makersuite.google.com/app/apikey 에 접속합니다.

2. Google 계정으로 로그인
   - Google 계정이 없다면 새로 만드세요.

3. API 키 생성
   - 'Create API Key' 버튼을 클릭합니다.
   - 새로 생성된 API 키를 복사합니다.

4. API 키 사용
   - 복사한 API 키를 프로그램의 Gemini API 키 입력란에 붙여넣습니다.

주의사항:
- API 키는 비밀번호처럼 안전하게 보관하세요.
- API 키가 노출되면 즉시 재발급 받으세요.
- 무료 사용량 제한이 있으니 참고하세요.`,

    openai: `[OpenAI API 키 얻는 방법]

1. OpenAI 웹사이트 접속
   - https://platform.openai.com/api-keys 에 접속합니다.

2. OpenAI 계정 생성/로그인
   - 계정이 없다면 새로 만드세요.
   - 로그인 후 API 키 페이지로 이동합니다.

3. API 키 생성
   - 'Create new secret key' 버튼을 클릭합니다.
   - 키 이름을 입력하고 생성합니다.
   - 새로 생성된 API 키를 복사합니다.

4. API 키 사용
   - 복사한 API 키를 프로그램의 OpenAI API 키 입력란에 붙여넣습니다.

주의사항:
- API 키는 비밀번호처럼 안전하게 보관하세요.
- API 키가 노출되면 즉시 재발급 받으세요.`
};

// 이벤트 리스너
searchBtn.addEventListener('click', handleSearch);
saveBtn.addEventListener('click', handleSave);
uploadBtn.addEventListener('click', () => pdfFile.click());
compareBtn.addEventListener('click', handleCompare);
closeModal.addEventListener('click', () => helpModal.style.display = 'none');

// PDF 파일 선택 시 이벤트
pdfFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        updateStatus(`PDF 파일이 선택되었습니다: ${file.name}`, 0);
    }
});

// API 키 도움말 버튼 이벤트
document.querySelectorAll('.help-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const apiType = this.getAttribute('data-api');
        showApiHelp(apiType);
    });
});

// 검색 처리
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        updateStatus('검색어를 입력해주세요.');
        return;
    }

    updateStatus('검색 중...', 0);
    try {
        console.log('검색 요청 시작:', query);
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        console.log('서버 응답 상태:', response.status);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '검색 실패');
        }

        const data = await response.json();
        console.log('검색 결과:', data);
        
        if (!data.results || data.results.length === 0) {
            resultText.innerHTML = '<p>검색 결과가 없습니다.</p>';
            updateStatus('검색 결과가 없습니다.', 100);
            return;
        }

        displayResults(data);
        updateStatus(`검색 완료! (${data.results.length}건)`, 100);
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        updateStatus(`오류 발생: ${error.message}`, 0);
        resultText.innerHTML = `<p class="error">오류가 발생했습니다: ${error.message}</p>`;
    }
}

// 결과 표시
function displayResults(data) {
    resultText.innerHTML = '';
    if (data.results && data.results.length > 0) {
        data.results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'result-item mb-8';

            // 조례명: 붉은색 굵게
            const lawName = `<span class="font-bold text-red-600 text-lg">${result.name}</span>`;

            // 조문 내용: 배열 또는 문자열
            let articles = result.content;
            let lawContent = '';
            if (Array.isArray(articles)) {
                if (articles.length > 0) {
                    lawContent = articles.map(article =>
                        `<div class="law-article text-black" style="margin-bottom:8px;">${article.replace(/\n/g, '<br>')}</div>`
                    ).join('');
                } else {
                    lawContent = `<div class="law-article text-gray-500">(조문 없음)</div>`;
                }
            } else if (typeof articles === 'string') {
                lawContent = `<div class="law-article text-black">${articles.replace(/\n/g, '<br>')}</div>`;
            } else {
                lawContent = `<div class="law-article text-gray-500">(조문 없음)</div>`;
            }

            resultElement.innerHTML = `
                <div class="mb-2">${lawName}</div>
                <div>${lawContent}</div>
            `;
            resultText.appendChild(resultElement);
        });
    } else {
        resultText.innerHTML = '<p>검색 결과가 없습니다.</p>';
    }
}

// 파일 저장 처리
async function handleSave() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('검색어를 입력해주세요.');
        return;
    }

    try {
        updateStatus('검색 결과를 Word 문서로 저장 중...', 50);
        
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '저장 중 오류가 발생했습니다.');
        }

        // 파일 다운로드 처리
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `조례_검색결과_${new Date().toISOString().slice(0,19).replace(/[:]/g, '')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        updateStatus('Word 문서 저장이 완료되었습니다.', 100);
    } catch (error) {
        console.error('저장 중 오류:', error);
        updateStatus(`오류: ${error.message}`, 0);
    }
}

// PDF 업로드 처리
function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        updateStatus('PDF 업로드 중...', 0);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            console.log('PDF 업로드 시작:', file.name);
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            console.log('서버 응답 상태:', response.status);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '업로드 실패');
            }

            console.log('PDF 업로드 성공:', data.message);
            updateStatus('PDF 업로드 완료!', 100);
            resultText.innerHTML = `<p class="success">${data.message}</p>`;
        } catch (error) {
            console.error('PDF 업로드 중 오류 발생:', error);
            updateStatus(`오류 발생: ${error.message}`, 0);
            resultText.innerHTML = `<p class="error">오류가 발생했습니다: ${error.message}</p>`;
        }
    };
    input.click();
}

// 비교 분석 처리
async function handleCompare() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    const geminiApiKey = document.getElementById('geminiApiKey').value.trim();
    const openaiApiKey = document.getElementById('openaiApiKey').value.trim();
    
    if (!query) {
        alert('검색어를 입력해주세요.');
        return;
    }
    
    if (!geminiApiKey && !openaiApiKey) {
        alert('API 키를 하나 이상 입력해주세요.');
        return;
    }

    const pdfFile = document.getElementById('pdfFile').files[0];
    if (!pdfFile) {
        alert('PDF 파일을 선택해주세요.');
        return;
    }

    try {
        updateStatus('비교 분석을 시작합니다...잠시만 기다려주세요', 0);
        
        const formData = new FormData();
        formData.append('pdf', pdfFile);
        formData.append('query', query);
        if (geminiApiKey) formData.append('geminiApiKey', geminiApiKey);
        if (openaiApiKey) formData.append('openaiApiKey', openaiApiKey);

        const response = await fetch('/api/compare', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '비교 분석 중 오류가 발생했습니다.');
        }

        // 파일 다운로드 처리
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `조례_비교분석_${new Date().toISOString().slice(0,19).replace(/[:]/g, '')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        updateStatus('비교 분석이 완료되었습니다.', 100);
    } catch (error) {
        console.error('비교 분석 중 오류:', error);
        updateStatus(`오류: ${error.message}`, 0);
    }
}

// API 도움말 표시
function showApiHelp(apiType) {
    helpContent.innerHTML = apiHelpContent[apiType].replace(/\n/g, '<br>');
    helpModal.style.display = 'block';
}

// 상태 업데이트
function updateStatus(message, progress) {
    statusMessage.textContent = message;
    if (progress !== undefined) {
        progressBar.style.width = `${progress}%`;
    }
}

// 모달 외부 클릭 시 닫기
window.onclick = (event) => {
    if (event.target === helpModal) {
        helpModal.style.display = 'none';
    }
}; 