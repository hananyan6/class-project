import React, { useState } from 'react';

function ProductNew({ onAddProduct, onCancel }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('JPEG、PNG、GIF、WebP形式の画像を選択してください。');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('画像は5MB以下にしてください。');
      e.target.value = '';
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onAddProduct({
      name,
      category,
      price: Number(price),
      stock: Number(stock),
      image,
    });
  };

  return (
    <main className="content">
      <div className="content-header">
        <h3>新規商品登録</h3>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">商品名</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ダウンジャケット Sサイズ"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">カテゴリ</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例: 犬用の服"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">価格 (円)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="例: 2000"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stock">在庫数</label>
          <input
            type="number"
            id="stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="例: 5"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">商品画像（任意・5MB以下）</label>
          <input
            type="file"
            id="image"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
          />

          {imagePreview && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={imagePreview}
                alt="商品画像のプレビュー"
                style={{
                  width: '150px',
                  height: '150px',
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                }}
              />
            </div>
          )}
        </div>

        <div className="form-buttons">
          <button type="submit" className="save-button">
            登録する
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
          >
            キャンセル
          </button>
        </div>
      </form>
    </main>
  );
}

export default ProductNew;
