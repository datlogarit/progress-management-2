import React, { useState } from 'react';
import toast from 'react-hot-toast';

export function TestPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  // Lấy URL từ biến môi trường .env hoặc cấu hình lưu tạm
  const getLambdaUrl = () => {
    return (
      import.meta.env.VITE_LAMBDA_TRIGGER_URL ||
      localStorage.getItem('test_lambda_url') ||
      ''
    );
  };

  const handleConfigUrl = () => {
    const current = getLambdaUrl();
    const input = window.prompt(
      'Nhập AWS Lambda Function URL hoặc API Gateway Endpoint:\n(Ví dụ: https://xxxx.lambda-url.ap-southeast-1.on.aws/)',
      current
    );
    if (input !== null) {
      localStorage.setItem('test_lambda_url', input.trim());
      if (input.trim()) {
        toast.success('Đã lưu Lambda Endpoint!');
      } else {
        toast('Đã xóa Lambda Endpoint.', { icon: 'ℹ️' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error('Vui lòng nhập đoạn văn bản!');
      return;
    }

    let lambdaUrl = getLambdaUrl();

    // Nếu chưa cấu hình URL, gợi ý người dùng nhập ngay
    if (!lambdaUrl) {
      const input = window.prompt(
        'Chưa có AWS Lambda URL. Vui lòng nhập Lambda Function URL hoặc API Gateway Endpoint:\n(Bạn cũng có thể cấu hình VITE_LAMBDA_TRIGGER_URL trong file .env)'
      );
      if (input && input.trim()) {
        lambdaUrl = input.trim();
        localStorage.setItem('test_lambda_url', lambdaUrl);
      } else {
        toast.error('Cần có Lambda URL để thực hiện trigger!');
        return;
      }
    }

    setLoading(true);
    const toastId = toast.loading('Đang trigger Lambda để ghi đè message.txt trên S3...');

    try {
      const response = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}: Không thể gọi Lambda`);
      }

      toast.success(
        data?.message || 'Đã trigger Lambda và ghi đè message.txt trên S3 thành công!',
        { id: toastId }
      );
      setText('');
    } catch (err: any) {
      console.error('Lỗi khi trigger Lambda:', err);
      toast.error(
        `Lỗi trigger Lambda: ${err?.message || 'Không thể kết nối tới Lambda'}. Kiểm tra CORS hoặc URL.`,
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        padding: '20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '500px',
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập đoạn văn bản tại đây..."
          rows={6}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '15px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            fontSize: '15px',
            fontWeight: 600,
            background: loading ? '#94a3b8' : '#1F6F78',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Đang gửi lên Lambda...' : 'Submit'}
        </button>

        <div style={{ textAlign: 'right' }}>
          <button
            type="button"
            onClick={handleConfigUrl}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              color: '#5C6773',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            ⚙️ Cấu hình Lambda URL
          </button>
        </div>
      </form>
    </div>
  );
}

export default TestPage;
