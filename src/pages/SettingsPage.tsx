import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { deleteCategory, exportData, getCategories, importData, onStorageChanged, saveCategory } from '../storage/db';
import { isExportPayload } from '../storage/validators';
import type { Category } from '../types/models';

function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const load = async () => {
      const nextCategories = await getCategories();
      setCategories(nextCategories);
    };

    load();
    return onStorageChanged(load);
  }, []);

  const handleAddCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newCategoryName.trim()) {
      return;
    }

    await saveCategory({ name: newCategoryName });
    setNewCategoryName('');
    setNotice('已添加新类别。');
  };

  const handleRenameCategory = async (categoryId: string, name: string) => {
    await saveCategory({ id: categoryId, name });
    setNotice('类别名称已更新。');
  };

  const handleDeleteCategory = async (categoryId: string, name: string) => {
    if (!window.confirm(`确定删除“${name}”类别吗？这个类别下的物品会移动到其他类别。`)) {
      return;
    }

    await deleteCategory(categoryId);
    setNotice('类别已删除，原有物品已移动到其他类别。');
  };

  const handleExport = async () => {
    const payload = await exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `things-record-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('备份文件已导出。');
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;

    if (!isExportPayload(parsed)) {
      setNotice('导入失败：文件格式不正确。');
      return;
    }

    await importData(parsed);
    setNotice('数据已导入。');
    event.target.value = '';
  };

  return (
    <div className="page">
      <PageHeader title="设置" subtitle="管理类别，并定期导出备份，避免浏览器数据被误清理。" />

      <section className="settings-card">
        <h2>类别管理</h2>
        <form className="inline-form" onSubmit={handleAddCategory}>
          <input
            type="text"
            value={newCategoryName}
            placeholder="新增一个类别"
            onChange={(event) => setNewCategoryName(event.target.value)}
          />
          <button type="submit" className="button button--primary">
            添加
          </button>
        </form>

        <div className="settings-list">
          {categories.map((category) => (
            <CategoryEditor
              key={category.id}
              category={category}
              onSave={handleRenameCategory}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      </section>

      <section className="settings-card">
        <h2>数据备份</h2>
        <p>当前版本只保存在本机浏览器里。建议偶尔导出一次 JSON 备份。</p>
        <div className="settings-actions">
          <button type="button" className="button button--primary" onClick={handleExport}>
            导出备份
          </button>
          <label className="button button--ghost settings-import">
            导入备份
            <input type="file" accept="application/json" onChange={handleImport} />
          </label>
        </div>
      </section>

      {notice ? <p className="notice-text">{notice}</p> : null}
    </div>
  );
}

type CategoryEditorProps = {
  category: Category;
  onSave: (categoryId: string, name: string) => Promise<void>;
  onDelete: (categoryId: string, name: string) => Promise<void>;
};

function CategoryEditor({ category, onSave, onDelete }: CategoryEditorProps) {
  const [name, setName] = useState(category.name);

  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  return (
    <div className="category-editor">
      <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
      <button type="button" className="button button--ghost" onClick={() => onSave(category.id, name)}>
        保存
      </button>
      <button type="button" className="button button--danger" onClick={() => onDelete(category.id, category.name)}>
        删除
      </button>
    </div>
  );
}

export default SettingsPage;
