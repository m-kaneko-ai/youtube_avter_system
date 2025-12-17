"""
Social Blade Service 簡易テストスクリプト（依存最小化版）
"""
import asyncio
import logging

# ロガー設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# モックデータでのテスト
def test_mock_data():
    """モックデータ生成のテスト"""
    from app.services.external.social_blade_service import SocialBladeService

    service = SocialBladeService()

    print("=" * 60)
    print("Social Blade Service - モックデータテスト")
    print("=" * 60)

    # モック統計データ
    test_channel_id = "UCX_6VhS0au0WcEgvBGjK8kg"
    mock_stats = service._get_mock_channel_stats(test_channel_id)

    print(f"\n1. チャンネル統計（モック）")
    print("-" * 60)
    print(f"   - チャンネル名: {mock_stats.get('username', 'N/A')}")
    print(f"   - 登録者数: {mock_stats.get('subscriber_count', 0):,}")
    print(f"   - 総再生回数: {mock_stats.get('total_views', 0):,}")
    print(f"   - 動画数: {mock_stats.get('video_count', 0):,}")
    print(f"   - グレード: {mock_stats.get('grade', 'N/A')}")

    # モック履歴データ
    mock_history = service._get_mock_channel_history(test_channel_id, days=7)

    print(f"\n2. 履歴データ（モック）")
    print("-" * 60)
    print(f"   - データ件数: {len(mock_history)}件")
    if mock_history:
        print(f"   - 最新日: {mock_history[-1].get('date', 'N/A')}")
        print(f"   - 最新登録者数: {mock_history[-1].get('subscriber_count', 0):,}")
        print(f"   - 最新変化: {mock_history[-1].get('subscriber_change', 0):+,}")

    # モック成長率データ
    mock_growth = service._get_mock_channel_growth(test_channel_id)

    print(f"\n3. 成長率（モック）")
    print("-" * 60)
    print(f"   - 週間登録者増: {mock_growth.get('subscriber_growth_7d', 0):,}")
    print(f"   - 月間登録者増: {mock_growth.get('subscriber_growth_30d', 0):,}")
    print(f"   - 平均日次登録者増: {mock_growth.get('avg_daily_subs', 0):,.0f}")
    print(f"   - 平均日次再生数: {mock_growth.get('avg_daily_views', 0):,}")

    print("\n" + "=" * 60)
    print("モックデータテスト完了 ✅")
    print("=" * 60)


async def test_real_service():
    """実際のサービステスト（API利用可能な場合）"""
    from app.services.external.social_blade_service import SocialBladeService

    service = SocialBladeService()

    print("\n" + "=" * 60)
    print("Social Blade Service - 実動作テスト")
    print("=" * 60)

    test_channel_id = "UCX_6VhS0au0WcEgvBGjK8kg"

    print(f"\n1. チャンネル統計取得")
    print("-" * 60)

    try:
        stats = await service.get_channel_stats(test_channel_id)
        print(f"✅ 統計取得成功")
        print(f"   - チャンネル名: {stats.get('username', 'N/A')}")
        print(f"   - 登録者数: {stats.get('subscriber_count', 0):,}")
        print(f"   - モックデータ: {stats.get('_is_mock', False)}")
    except Exception as e:
        print(f"❌ エラー: {e}")

    print(f"\n2. 成長率取得")
    print("-" * 60)

    try:
        growth = await service.get_growth_rate(test_channel_id)
        print(f"✅ 成長率取得成功")
        print(f"   - 週間登録者増: {growth.get('subscriber_growth_7d', 0):,}")
        print(f"   - モックデータ: {growth.get('_is_mock', False)}")
    except Exception as e:
        print(f"❌ エラー: {e}")

    print("\n" + "=" * 60)
    print("実動作テスト完了")
    print("=" * 60)


if __name__ == "__main__":
    # まずモックデータのテスト
    test_mock_data()

    # 次に実サービスのテスト
    print("\n" + "=" * 60)
    print("続いて実サービステストを実行します...")
    print("=" * 60)

    asyncio.run(test_real_service())
