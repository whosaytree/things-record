import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { deleteItem, getCategories, getItem } from '../storage/db';
import type { Category, ItemRecord } from '../types/models';

function ItemDetailPage() {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!itemId) {
        return;
      }

      const [nextItem, nextCategories] = await Promise.all([getItem(itemId), getCategories()]);

      if (!isMounted) {
        return;
      }

      setItem(nextItem);
      setCategories(nextCategories);
      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  const categoryName = useMemo(
    () => categories.find((category) => category.id === item?.categoryId)?.name ?? '未分类',
    [categories, item]
  );

  const handleDelete = async () => {
    if (!itemId || !window.confirm('确定删除这条记录吗？')) {
      return;
    }

    await deleteItem(itemId);
    navigate('/');
  };

  if (loading) {
    return <div className="page"><p className="loading-text">正在加载详情...</p></div>;
  }

  if (!item) {
    return (
      <div className="page">
        <EmptyState title="没有找到这条记录" description="它可能已经被删除，或者当前链接无效。" />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={item.name}
        subtitle={`${categoryName} · ${formatDate(item.updatedAt)} 更新`}
        action={
          <Link to={`/items/${item.id}/edit`} className="button button--primary">
            编辑
          </Link>
        }
      />

      <section className="detail-card">
        <div className="detail-card__image">
          {item.imageDataUrl ? <img src={item.imageDataUrl} alt={item.name} /> : <div className="detail-card__placeholder">{categoryName.slice(0, 1)}</div>}
        </div>

        <div className="detail-card__meta">
          <div className="detail-pill">{categoryName}</div>
          <div className="detail-pill">{item.rating ? `${item.rating} / 5 分` : '未评分'}</div>
        </div>

        <div className="detail-section">
          <h2>描述</h2>
          <p>{item.note || '还没有填写描述。'}</p>
        </div>

        <div className="detail-section">
          <h2>购买链接</h2>
          {item.link ? (
            <a href={item.link} target="_blank" rel="noreferrer" className="text-link">
              打开原始链接
            </a>
          ) : (
            <p>没有保存链接。</p>
          )}
        </div>

        <div className="detail-section detail-section--times">
          <p>创建于 {formatDate(item.createdAt)}</p>
          <p>最近更新于 {formatDate(item.updatedAt)}</p>
        </div>
      </section>

      <button type="button" className="button button--danger button--block" onClick={handleDelete}>
        删除这条记录
      </button>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value));
}

export default ItemDetailPage;
