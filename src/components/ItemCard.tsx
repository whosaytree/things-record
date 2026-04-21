import { Link } from 'react-router-dom';
import type { ItemRecord } from '../types/models';

type ItemCardProps = {
  item: ItemRecord;
  categoryName: string;
};

function ItemCard({ item, categoryName }: ItemCardProps) {
  return (
    <Link to={`/items/${item.id}`} className="item-card">
      <div className="item-card__image">
        {item.imageDataUrl ? (
          <img src={item.imageDataUrl} alt={item.name} />
        ) : (
          <div className="item-card__placeholder">{categoryName.slice(0, 1)}</div>
        )}
      </div>
      <div className="item-card__body">
        <div className="item-card__top">
          <strong>{item.name}</strong>
          <span className="item-card__rating">{formatRating(item.rating)}</span>
        </div>
        <p>{item.note || '还没有补充描述'}</p>
      </div>
    </Link>
  );
}

function formatRating(rating: number | null) {
  if (!rating) {
    return '未评分';
  }

  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
}

export default ItemCard;
