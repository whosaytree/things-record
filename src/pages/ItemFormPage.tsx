import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { getCategories, getItem, saveItem } from '../storage/db';
import type { Category } from '../types/models';

type FormState = {
  name: string;
  categoryId: string;
  rating: number | null;
  note: string;
  imageDataUrl: string;
  link: string;
};

const initialState: FormState = {
  name: '',
  categoryId: '',
  rating: null,
  note: '',
  imageDataUrl: '',
  link: ''
};

function ItemFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ itemId: string }>();
  const isEditing = Boolean(params.itemId);
  const presetCategoryId = (location.state as { categoryId?: string } | null)?.categoryId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const nextCategories = await getCategories();
      const editableItem = params.itemId ? await getItem(params.itemId) : null;

      if (!isMounted) {
        return;
      }

      setCategories(nextCategories);
      setForm(
        editableItem
          ? {
              name: editableItem.name,
              categoryId: editableItem.categoryId,
              rating: editableItem.rating,
              note: editableItem.note,
              imageDataUrl: editableItem.imageDataUrl,
              link: editableItem.link
            }
          : {
              ...initialState,
              categoryId: presetCategoryId ?? nextCategories[0]?.id ?? ''
            }
      );
      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [params.itemId, presetCategoryId]);

  const pageTitle = useMemo(() => (isEditing ? '编辑物品' : '新增物品'), [isEditing]);

  const handleChange = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleChange('imageDataUrl', typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.categoryId) {
      setError('请至少填写名称并选择类别。');
      return;
    }

    setError('');
    setSaving(true);

    const savedItem = await saveItem({
      id: params.itemId,
      name: form.name,
      categoryId: form.categoryId,
      rating: form.rating,
      note: form.note,
      imageDataUrl: form.imageDataUrl,
      link: form.link
    });

    navigate(`/items/${savedItem.id}`);
  };

  if (loading) {
    return <div className="page"><p className="loading-text">正在加载表单...</p></div>;
  }

  return (
    <div className="page">
      <PageHeader
        title={pageTitle}
        subtitle="只保留真正会回看的信息：名称、类别、评分和一句使用感受。"
        action={
          <Link to={params.itemId ? `/items/${params.itemId}` : '/'} className="button button--ghost">
            取消
          </Link>
        }
      />

      <form className="form-card" onSubmit={handleSubmit}>
        <label className="field">
          <span>名称</span>
          <input
            type="text"
            value={form.name}
            placeholder="例如：白色衬衫 / 精华液 / 黑巧克力"
            onChange={(event) => handleChange('name', event.target.value)}
            autoFocus
          />
        </label>

        <label className="field">
          <span>类别</span>
          <select value={form.categoryId} onChange={(event) => handleChange('categoryId', event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>评分</span>
          <div className="rating-group">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                className={`rating-chip${form.rating === value ? ' rating-chip--active' : ''}`}
                onClick={() => handleChange('rating', value)}
              >
                {value} 分
              </button>
            ))}
            <button
              type="button"
              className={`rating-chip${form.rating === null ? ' rating-chip--active' : ''}`}
              onClick={() => handleChange('rating', null)}
            >
              暂不评分
            </button>
          </div>
        </div>

        <label className="field">
          <span>描述</span>
          <textarea
            rows={5}
            value={form.note}
            placeholder="写下你下次回看时最想知道的内容，比如质地、口感、是否会回购。"
            onChange={(event) => handleChange('note', event.target.value)}
          />
        </label>

        <label className="field">
          <span>图片</span>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {form.imageDataUrl ? (
            <div className="image-preview">
              <img src={form.imageDataUrl} alt="预览" />
              <button type="button" className="button button--ghost" onClick={() => handleChange('imageDataUrl', '')}>
                移除图片
              </button>
            </div>
          ) : null}
        </label>

        <label className="field">
          <span>购买链接</span>
          <input
            type="url"
            value={form.link}
            placeholder="https://"
            onChange={(event) => handleChange('link', event.target.value)}
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" className="button button--primary button--block" disabled={saving}>
          {saving ? '保存中...' : '保存物品'}
        </button>
      </form>
    </div>
  );
}

export default ItemFormPage;
