import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ItemCard from '../components/ItemCard';
import PageHeader from '../components/PageHeader';
import { getCategories, getItems, onStorageChanged } from '../storage/db';
import type { Category, ItemRecord } from '../types/models';

function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const [nextCategories, nextItems] = await Promise.all([getCategories(), getItems()]);

      if (!isMounted) {
        return;
      }

      setCategories(nextCategories);
      setItems(nextItems);
      setLoading(false);
    };

    load();
    const dispose = onStorageChanged(load);

    return () => {
      isMounted = false;
      dispose();
    };
  }, []);

  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  const visibleItems = normalizedKeyword
    ? items.filter((item) => {
        const searchableText = `${item.name} ${item.note}`.toLocaleLowerCase();
        return searchableText.includes(normalizedKeyword);
      })
    : items;

  const groupedItems = categories.map((category) => ({
    category,
    items: visibleItems.filter((item) => item.categoryId === category.id)
  }));

  return (
    <div className="page page--home">
      <PageHeader
        title="我的物品记录"
        subtitle="按类别查看你的日常物品记录，随手记下评分、图片和使用感受。"
        action={
          <Link to="/items/new" className="button button--primary">
            新增物品
          </Link>
        }
      />

      <section className="panel panel--warm">
        <p className="panel__title">记录原则</p>
        <p className="panel__text">只记录你之后会回看参考的东西。保持简单，反而更容易长期用下去。</p>
      </section>

      <label className="search-box">
        <span>关键词检索</span>
        <input
          type="search"
          value={keyword}
          placeholder="例如：上衣、精华、巧克力"
          onChange={(event) => setKeyword(event.target.value)}
        />
      </label>

      {loading ? <p className="loading-text">正在加载记录...</p> : null}

      {!loading && items.length === 0 ? (
        <EmptyState title="还没有记录" description="先从一件最常买的物品开始，比如最近在用的护肤品或常吃的零食。" />
      ) : null}

      {!loading && items.length > 0 && visibleItems.length === 0 ? (
        <EmptyState title="没有匹配结果" description="换一个更短的关键词试试，比如只搜“上衣”或品牌名。" />
      ) : null}

      <div className="category-stack">
        {groupedItems.map(({ category, items: categoryItems }) => (
          <section key={category.id} className="category-panel">
            <div className="category-panel__header">
              <div>
                <h2>{category.name}</h2>
                <p>{categoryItems.length} 件物品</p>
              </div>
              <Link to="/items/new" state={{ categoryId: category.id }} className="text-link">
                在此类别新增
              </Link>
            </div>

            {categoryItems.length > 0 ? (
              <div className="item-list">
                {categoryItems.map((item) => (
                  <ItemCard key={item.id} item={item} categoryName={category.name} />
                ))}
              </div>
            ) : (
              <div className="category-panel__empty">这个类别还没有物品。</div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
