"""
埋め込み再生成スクリプト

全ナレッジまたは指定されたナレッジの埋め込みを再生成します。
"""
import asyncio
import sys
from pathlib import Path
from typing import Optional
from uuid import UUID

# バックエンドのルートディレクトリをパスに追加
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.models.knowledge import Knowledge
from app.services.embedding_service import embedding_service


async def regenerate_all_embeddings(
    client_id: Optional[UUID] = None,
    dry_run: bool = False
) -> None:
    """
    全ナレッジの埋め込みを再生成

    Args:
        client_id: 特定のクライアントIDを指定した場合、そのクライアントのナレッジのみ処理
        dry_run: Trueの場合、実際には更新せずコスト見積もりのみ表示
    """
    print("=" * 60)
    print("埋め込み再生成スクリプト")
    print("=" * 60)

    if dry_run:
        print("[DRY RUN MODE] 実際には更新しません\n")

    async with async_session_maker() as db:
        # ナレッジを取得
        stmt = select(Knowledge)
        if client_id:
            stmt = stmt.where(Knowledge.client_id == client_id)
            print(f"クライアントID {client_id} のナレッジを処理します")
        else:
            print("全ナレッジを処理します")

        result = await db.execute(stmt)
        knowledges = result.scalars().all()

        total_count = len(knowledges)
        print(f"対象ナレッジ数: {total_count}\n")

        if total_count == 0:
            print("処理対象のナレッジがありません。")
            return

        # コスト見積もり
        total_tokens = 0
        total_cost = 0.0

        for knowledge in knowledges:
            text = await embedding_service._extract_knowledge_text(knowledge)
            tokens, cost = embedding_service.estimate_cost(text)
            total_tokens += tokens
            total_cost += cost

        print(f"推定トークン数: {total_tokens:,} tokens")
        print(f"推定コスト: ${total_cost:.6f} USD")
        print()

        if dry_run:
            print("[DRY RUN] コスト見積もりのみ実行しました。")
            return

        # 確認
        response = input("埋め込みを生成しますか？ (y/N): ")
        if response.lower() != 'y':
            print("キャンセルしました。")
            return

        print()
        print("埋め込み生成を開始します...")
        print("-" * 60)

        # 埋め込み生成
        knowledge_ids = [knowledge.id for knowledge in knowledges]
        success, failure, actual_cost = await embedding_service.batch_update_embeddings(
            knowledge_ids, db
        )

        print("-" * 60)
        print("\n結果:")
        print(f"  成功: {success} 件")
        print(f"  失敗: {failure} 件")
        print(f"  実際のコスト: ${actual_cost:.6f} USD")
        print("\n完了しました。")


async def regenerate_single_embedding(knowledge_id: UUID) -> None:
    """
    単一ナレッジの埋め込みを再生成

    Args:
        knowledge_id: ナレッジID
    """
    print("=" * 60)
    print(f"ナレッジ {knowledge_id} の埋め込みを再生成")
    print("=" * 60)

    async with async_session_maker() as db:
        try:
            knowledge = await embedding_service.update_knowledge_embedding(
                knowledge_id, db
            )
            print(f"\n成功: {knowledge.name} の埋め込みを更新しました。")
        except ValueError as e:
            print(f"\nエラー: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"\n予期しないエラー: {e}")
            sys.exit(1)


async def show_stats() -> None:
    """
    埋め込み統計を表示
    """
    print("=" * 60)
    print("埋め込み統計")
    print("=" * 60)

    async with async_session_maker() as db:
        # 全ナレッジ数
        result = await db.execute(select(Knowledge))
        all_knowledges = result.scalars().all()
        total_count = len(all_knowledges)

        # 埋め込みがあるナレッジ数
        result = await db.execute(
            select(Knowledge).where(Knowledge.embedding.isnot(None))
        )
        with_embedding = result.scalars().all()
        with_embedding_count = len(with_embedding)

        # 埋め込みがないナレッジ数
        without_embedding_count = total_count - with_embedding_count

        print(f"\n全ナレッジ数: {total_count}")
        print(f"埋め込みあり: {with_embedding_count}")
        print(f"埋め込みなし: {without_embedding_count}")

        if total_count > 0:
            percentage = (with_embedding_count / total_count) * 100
            print(f"カバー率: {percentage:.1f}%")


def print_usage():
    """使用方法を表示"""
    print("使用方法:")
    print("  python regenerate_embeddings.py [options]")
    print()
    print("オプション:")
    print("  --all               全ナレッジの埋め込みを再生成")
    print("  --client <id>       特定クライアントのナレッジのみ処理")
    print("  --knowledge <id>    単一ナレッジの埋め込みを再生成")
    print("  --dry-run           実際には更新せずコスト見積もりのみ表示")
    print("  --stats             埋め込み統計を表示")
    print("  --help              このヘルプを表示")
    print()
    print("例:")
    print("  python regenerate_embeddings.py --all")
    print("  python regenerate_embeddings.py --all --dry-run")
    print("  python regenerate_embeddings.py --client 550e8400-e29b-41d4-a716-446655440000")
    print("  python regenerate_embeddings.py --knowledge 550e8400-e29b-41d4-a716-446655440001")
    print("  python regenerate_embeddings.py --stats")


async def main():
    """メイン処理"""
    args = sys.argv[1:]

    if not args or "--help" in args:
        print_usage()
        return

    dry_run = "--dry-run" in args

    if "--stats" in args:
        await show_stats()

    elif "--all" in args:
        client_id = None
        if "--client" in args:
            try:
                client_idx = args.index("--client")
                client_id = UUID(args[client_idx + 1])
            except (IndexError, ValueError) as e:
                print(f"エラー: 無効なクライアントID: {e}")
                sys.exit(1)

        await regenerate_all_embeddings(client_id=client_id, dry_run=dry_run)

    elif "--knowledge" in args:
        try:
            knowledge_idx = args.index("--knowledge")
            knowledge_id = UUID(args[knowledge_idx + 1])
            await regenerate_single_embedding(knowledge_id)
        except (IndexError, ValueError) as e:
            print(f"エラー: 無効なナレッジID: {e}")
            sys.exit(1)

    else:
        print("エラー: 無効なオプションです。")
        print()
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n中断されました。")
        sys.exit(0)
