import React, { useState, useEffect } from 'react';
import pawIcon from './paw-icon.png';
import './App.css';
import ProductNew from './ProductNew';

// 商品データ
const initialProducts = [
  { id: 1, name: 'ダウンジャケット Sサイズ', price: 2000, stock: 5, category: '犬用の服' },
  { id: 2, name: 'ダウンジャケット Mサイズ', price: 2500, stock: 3, category: '犬用の服' },
  { id: 3, name: 'ころころボール', price: 800, stock: 3, category: 'おもちゃ' },
  { id: 4, name: 'かみかみボーン', price: 900, stock: 5, category: 'おもちゃ' },
  { id: 5, name: 'ボディハーネス', price: 1980, stock: 4, category: 'アクセサリー' },
  { id: 6, name: 'チョークチェーン', price: 1000, stock: 3, category: 'アクセサリー' },
  { id: 7, name: '鈴つき猫の首輪', price: 1000, stock: 4, category: 'アクセサリー' },
];

function App() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 表示する画面を管理するステート 
  const [currentView, setCurrentView] = useState('list');

  // 商品データ（SQLiteから読み込む）
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Spring Bootから商品データを読み込む
  
  // ログイン後にSpring Bootから商品データを読み込む
  useEffect(() => {
    // ログインしていなければ、商品データを取得しない
    if (!isLoggedIn) {
      setProducts([]);
      return;
    }

    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await fetch(
          'http://localhost:8080/api/products'
        );

        if (!response.ok) {
          throw new Error('商品データの読み込みに失敗しました');
        }

        const data = await response.json();

        if (!cancelled) {
          setProducts(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('商品データの読み込みエラー:', error);
          alert(
            '商品データを読み込めませんでした。Spring Bootが起動しているか確認してください。'
          );
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);
  
  const handleLogin = async (e) => {
  e.preventDefault();
  setLoginError('');

  try {
    const response = await fetch('http://localhost:8080/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setLoginError(data.message || 'ログインに失敗しました');
      return;
    }

    setIsLoggedIn(true);
  } catch (error) {
    setLoginError(
      'サーバーに接続できません。サーバーが起動しているか確認してください。'
    );
  }
};

  const handleLogout = () => {
    setIsLoggedIn(false);
  };
  
  // 新規商品をSQLiteに登録する関数
  const handleAddProduct = async (newProduct) => {
  try {
    let imagePath = null;

    // 画像が選択されている場合、先に画像をアップロードする
    if (newProduct.image) {
      const formData = new FormData();
      formData.append('image', newProduct.image);

      const imageResponse = await fetch(
        'http://localhost:8080/api/products/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        throw new Error(errorText || '画像のアップロードに失敗しました');
      }

      const imageData = await imageResponse.json();
      imagePath = imageData.imagePath;
    }

    // 商品情報と画像の保存先を登録する
    const productData = {
      name: newProduct.name,
      category: newProduct.category,
      price: newProduct.price,
      stock: newProduct.stock,
      imagePath,
    };

    const response = await fetch('http://localhost:8080/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error('商品の登録に失敗しました');
    }

    const createdProduct = await response.json();

    setProducts((prevProducts) => [...prevProducts, createdProduct]);
    setCurrentView('list');
  } catch (error) {
    console.error('商品登録エラー:', error);
    alert(
      '商品を登録できませんでした。Spring Bootが起動しているか確認してください。\n' +
      error.message
    );
  }
};

  // 編集ボタンが押されたとき（モーダルを開く）
  const handleEditClick = (product) => {
    setEditingProduct({ ...product });
  };

  // モーダルの入力値が変更されたとき
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct({
      ...editingProduct,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    });
  };

  // 編集した商品をSQLiteで更新する関数
  const handleSave = async (e) => {
  e.preventDefault();

  try {
    // もともとの画像パスを維持する
    let imagePath = editingProduct.imagePath;

    // 新しい画像が選択されている場合だけアップロードする
    if (editImage) {
      const formData = new FormData();
      formData.append('image', editImage);

      const imageResponse = await fetch(
        'http://localhost:8080/api/products/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        throw new Error(
          errorText || '画像のアップロードに失敗しました'
        );
      }

      const imageData = await imageResponse.json();
      imagePath = imageData.imagePath;
    }

    // 商品情報と画像パスを一緒に更新する
    const productData = {
      ...editingProduct,
      imagePath,
    };

    const response = await fetch(
      `http://localhost:8080/api/products/${editingProduct.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      }
    );

    if (!response.ok) {
      throw new Error('商品の更新に失敗しました');
    }

    const updatedProduct = await response.json();

    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p
      )
    );

    setEditingProduct(null);
    setEditImage(null);
  } catch (error) {
    console.error('商品更新エラー:', error);
    alert(
      '商品を更新できませんでした。\n' + error.message
    );
  }
};

  // モーダルを閉じる（キャンセル）
  const handleCloseModal = () => {
    setEditingProduct(null);
  };
  
  // 商品をSQLiteから削除する関数
  const handleDelete = async (id) => {
    if (window.confirm('本当にこの商品を削除しますか？')) {
      try {
        const response = await fetch(
          `http://localhost:8080/api/products/${id}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('商品の削除に失敗しました');
        }

        setProducts((prevProducts) =>
          prevProducts.filter((product) => product.id !== id)
        );
      } catch (error) {
        console.error('商品削除エラー:', error);
        alert('商品を削除できませんでした。Spring Bootの状態を確認してください。');
      }
    }
  };

  // カテゴリの一覧を自動取得（ドロップダウン用）
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // 検索・絞り込みフィルタリング
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === '' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });


  // 1. ログイン済みの画面
  if (isLoggedIn) {
    return (
      <div className="main-container">
        <header className="header">
          <h2 className="header-title">
          <img src={pawIcon} alt="" className="header-icon" />
            商品管理アプリケーション
          </h2>

          <button onClick={handleLogout} className="logout-button">
            ログアウト
           </button>
        </header>

        {/* currentView によって新規登録画面と一覧画面を切り替え */}
        {currentView === 'new' ? (
          /* ① 新規登録画面 */
          <ProductNew
            onAddProduct={handleAddProduct}
            onCancel={() => setCurrentView('list')}
          />
        ) : (
          /* ② 商品一覧画面 */
            <main className="content">
            <div className="content-header">
              <h3>商品一覧</h3>           
        <div
          style={{
            margin: '12px 0',
            padding: '10px',
            backgroundColor: '#fcffa5',
            border: '1px solid #f8ff1e',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
        <strong>⚠️ 在庫が少ない商品</strong>
            {products.filter((product) => Number(product.stock) <= 2).length === 0 ? (
            <p style={{ margin: '6px 0 0' }}>現在、在庫不足の商品はありません。</p>
       ) : (
        <ul style={{ margin: '6px 0 0' }}>
            {products
                .filter((product) => Number(product.stock) <= 2)
                .map((product) => (
                  <li key={product.id}>
            {product.name}：残り {product.stock} 個
                  </li>
                ))}
            </ul>
          )}
     </div>
              <button onClick={() => setCurrentView('new')} className="add-button">
                新規登録
              </button>
            </div>

            {/* 検索・絞り込みバー */}
            <div
              className="filter-container"
              style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}
            >
              <input
                type="text"
                placeholder="商品名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px', width: '200px' }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '8px' }}
              >
                <option value="">すべてのカテゴリ</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <table className="product-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>商品名</th>
                  <th>画像</th>
                  <th>カテゴリ</th>
                  <th>価格</th>
                  <th>在庫数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product,index) => (
                  <tr key={product.id}>
                  <td>{index + 1}</td>

                 <td className="product-name">{product.name}</td>

             <td>
                     {product.imagePath && (
             <img
                  src={`http://localhost:8080${product.imagePath}`}
                  alt={product.name}
                  style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'contain',
                }}
             />
          )}
    </td>

                    <td>{product.category}</td>
                    <td>¥{product.price.toLocaleString()}</td>
                    <td>{product.stock}個</td>
                    <td>
                      <button
                        onClick={() => handleEditClick(product)}
                        className="edit-button"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="delete-button"
                        style={{ marginLeft: '8px' }}
                      >
                        削除
                      </button>
                      <a 
                      href="https://www.idog.jp/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="store-button" 
                      >
                      注文
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 編集モーダル */}
            {editingProduct && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>商品情報の編集</h3>
                  <form onSubmit={handleSave}>
                    <div className="form-group">
                     <label>商品画像（変更する場合のみ選択）</label>
                     <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditImage(e.target.files[0] || null)}
                     />
                 </div>
                    <div className="form-group">
                      <label>商品名</label>
                      <input
                        type="text"
                        name="name"
                        value={editingProduct.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>カテゴリ</label>
                      <input
                        type="text"
                        name="category"
                        value={editingProduct.category}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>価格 (円)</label>
                      <input
                        type="number"
                        name="price"
                        value={editingProduct.price}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>在庫数</label>
                      <input
                        type="number"
                        name="stock"
                        value={editingProduct.stock}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="modal-buttons">
                      <button type="submit" className="save-button">
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="cancel-button"
                      >
                        キャンセル
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    );
  }

  // 2. 未ログインの画面（ログインフォーム）
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>商品管理アプリケーション</h2>
        <h3>ログイン</h3>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="userId">ユーザーID</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ユーザーIDを入力"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
            />
          </div>
          <button type="submit" className="login-button">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;