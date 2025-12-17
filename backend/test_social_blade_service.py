"""
Social Blade Service テストスクリプト

モックフォールバック、キャッシング、レート制限の動作確認
"""
import asyncio
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent))

# 直接インポート（循環依存を回避）
from app.services.external.social_blade_service import SocialBladeService

social_blade_service = SocialBladeService()


async def test_social_blade_service():
    """Social Blade Serviceの動作確認"""

    print("=" * 60)
    print("Social Blade Service テスト開始")
    print("=" * 60)

    # テスト用チャンネルID（実際のYouTubeチャンネルIDに置き換え可）
    test_channel_id = "UCX_6VhS0au0WcEgvBGjK8kg"  # 例: HikakinTV

    print(f"\n1. チャンネル統計取得テスト (channel_id: {test_channel_id})")
    print("-" * 60)

    try:
        stats = await social_blade_service.get_channel_stats(test_channel_id)
        print(f"✅ チャンネル統計取得成功")
        print(f"   - チャンネル名: {stats.get('username', 'N/A')}")
        print(f"   - 登録者数: {stats.get('subscriber_count', 0):,}")
        print(f"   - 総再生回数: {stats.get('total_views', 0):,}")
        print(f"   - 動画数: {stats.get('video_count', 0):,}")
        print(f"   - グレード: {stats.get('grade', 'N/A')}")
        print(f"   - モックデータ: {stats.get('_is_mock', False)}")
    except Exception as e:
        print(f"❌ エラー: {e}")

    print(f"\n2. 成長率取得テスト")
    print("-" * 60)

    try:
        growth = await social_blade_service.get_growth_rate(test_channel_id)
        print(f"✅ 成長率取得成功")
        print(f"   - 週間登録者増: {growth.get('subscriber_growth_7d', 0):,}")
        print(f"   - 月間登録者増: {growth.get('subscriber_growth_30d', 0):,}")
        print(f"   - 平均日次登録者増: {growth.get('avg_daily_subs', 0):,.0f}")
        print(f"   - 平均日次再生数: {growth.get('avg_daily_views', 0):,}")
        print(f"   - モックデータ: {growth.get('_is_mock', False)}")
    except Exception as e:
        print(f"❌ エラー: {e}")

    print(f"\n3. 履歴データ取得テスト (30日)")
    print("-" * 60)

    try:
        history = await social_blade_service.get_channel_history(test_channel_id, days=30)
        print(f"✅ 履歴データ取得成功")
        print(f"   - 取得件数: {len(history)}件")

        if history:
            print(f"   - 最新データ:")
            latest = history[-1]
            print(f"     - 日付: {latest.get('date', 'N/A')}")
            print(f"     - 登録者数: {latest.get('subscriber_count', 0):,}")
            print(f"     - 登録者変化: {latest.get('subscriber_change', 0):+,}")

            print(f"   - 最古データ:")
            oldest = history[0]
            print(f"     - 日付: {oldest.get('date', 'N/A')}")
            print(f"     - 登録者数: {oldest.get('subscriber_count', 0):,}")
    except Exception as e:
        print(f"❌ エラー: {e}")

    print(f"\n4. ランキング情報取得テスト")
    print("-" * 60)

    try:
        rank = await social_blade_service.get_channel_rank(test_channel_id)
        print(f"✅ ランキング取得成功")
        print(f"   - 登録者数ランク: {rank.get('subscriber_rank', 0):,}")
        print(f"   - 再生数ランク: {rank.get('video_views_rank', 0):,}")
        print(f"   - 国内ランク: {rank.get('country_rank', 0):,}")
        print(f"   - グレード: {rank.get('grade', 'N/A')}")
    except Exception as e:
        print(f"❌ エラー: {e}")

    print(f"\n5. 将来予測取得テスト")
    print("-" * 60)

    try:
        projections = await social_blade_service.get_future_projections(test_channel_id)
        print(f"✅ 将来予測取得成功")
        print(f"   - 1年後の登録者数予測: {projections.get('projected_subs_1_year', 0):,}")
        print(f"   - 推定月間収益: ${projections.get('estimated_monthly_earnings_min', 0):,} - ${projections.get('estimated_monthly_earnings_max', 0):,}")
        print(f"   - 推定年間収益: ${projections.get('estimated_yearly_earnings_min', 0):,} - ${projections.get('estimated_yearly_earnings_max', 0):,}")
        print(f"   - モックデータ: {projections.get('_is_mock', False)}")
    except Exception as e:
        print(f"❌ エラー: {e}")

    print(f"\n6. キャッシング動作確認（2回目のリクエスト）")
    print("-" * 60)

    try:
        import time
        start_time = time.time()
        stats2 = await social_blade_service.get_channel_stats(test_channel_id)
        elapsed = time.time() - start_time

        print(f"✅ 2回目の統計取得成功")
        print(f"   - レスポンス時間: {elapsed * 1000:.2f}ms")
        print(f"   - キャッシュから取得されていれば50ms以下のはず")
    except Exception as e:
        print(f"❌ エラー: {e}")

    print("\n" + "=" * 60)
    print("テスト完了")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_social_blade_service())
