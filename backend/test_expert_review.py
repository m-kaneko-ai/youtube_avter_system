"""
専門家レビュー機能のテスト

5人のAI専門家が台本を添削する機能のテスト
"""
import asyncio
import sys
import os

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.schemas.expert_review import ExpertReviewRequest, ScriptSectionInput
from app.services.expert_review_service import expert_review_service


async def test_expert_review():
    """専門家レビュー機能のテスト"""

    print("=" * 80)
    print("台本専門家レビュー機能テスト")
    print("=" * 80)

    # サンプル台本データ
    request = ExpertReviewRequest(
        script_id="test-script-001",
        source_ai_type="gemini",
        knowledge_id="test-knowledge-001",
        sections=[
            ScriptSectionInput(
                id="section-1",
                label="オープニング",
                timestamp="0:00",
                content="""こんにちは、みなさん。今日は副業について話します。
                          副業を始めたいけど、何から始めていいか分からない人は多いですよね。
                          今日はその悩みを解決します。"""
            ),
            ScriptSectionInput(
                id="section-2",
                label="本編",
                timestamp="0:30",
                content="""副業で成功するには3つのポイントがあります。
                          1つ目は自分のスキルを活かすこと。
                          2つ目は小さく始めること。
                          3つ目は継続すること。
                          これらを守れば、あなたも副業で月5万円稼げるようになります。"""
            ),
            ScriptSectionInput(
                id="section-3",
                label="エンディング",
                timestamp="1:30",
                content="""いかがでしたか？
                          もっと詳しく知りたい方は、概要欄のリンクをチェックしてください。
                          それでは、また次回の動画でお会いしましょう。"""
            )
        ]
    )

    print("\n📝 テスト台本:")
    print("-" * 80)
    for section in request.sections:
        print(f"\n【{section.label}】({section.timestamp})")
        print(section.content)

    print("\n\n🚀 5人の専門家によるレビュー開始...")
    print("-" * 80)

    try:
        # レビュー実行
        result = await expert_review_service.review_script(
            request=request,
            knowledge_context="ターゲット: 20-30代の会社員\n悩み: 副業で稼ぎたいが始め方が分からない"
        )

        print(f"\n✅ レビュー完了！（処理時間: {result.processing_time_ms}ms）")
        print("=" * 80)

        # 公開OK判定
        print(f"\n🎯 公開OK判定")
        print("-" * 80)
        print(f"グレード: {result.publish_readiness.grade.value}")
        print(f"スコア: {result.publish_readiness.score}/100")
        print(f"判定: {'公開OK ✅' if result.publish_readiness.ready else '再添削推奨 ❌'}")
        print(f"メッセージ: {result.publish_readiness.message}")

        # 専門家フィードバック
        print(f"\n\n👥 5人の専門家フィードバック")
        print("=" * 80)
        for i, feedback in enumerate(result.expert_feedbacks, 1):
            config = {
                "hook_master": ("🎣 フックマスター", "冒頭30秒の鬼"),
                "story_architect": ("🎬 ストーリーアーキテクト", "構成全体の設計士"),
                "entertainment_producer": ("🎭 エンタメプロデューサー", "演出とリズムの魔術師"),
                "target_insight": ("🎯 ターゲットインサイター", "ペルソナ共感の専門家"),
                "cta_strategist": ("📣 CTAストラテジスト", "行動喚起の戦略家"),
            }
            icon, description = config.get(feedback.expert_type.value, ("❓", "Unknown"))

            print(f"\n{i}. {icon} {description}")
            print(f"   スコア: {feedback.score}/100")
            print(f"   改善理由: {feedback.improvement_reason}")
            print(f"   提案:")
            for suggestion in feedback.suggestions:
                print(f"     • {suggestion}")

        # ビフォーアフター
        print(f"\n\n📊 ビフォーアフター比較")
        print("-" * 80)
        print(f"フックスコア:       {result.before_after.hook_score.before} → {result.before_after.hook_score.after} (+{result.before_after.hook_score.after - result.before_after.hook_score.before})")
        print(f"リテンションスコア: {result.before_after.retention_score.before} → {result.before_after.retention_score.after} (+{result.before_after.retention_score.after - result.before_after.retention_score.before})")
        print(f"CTAスコア:          {result.before_after.cta_score.before} → {result.before_after.cta_score.after} (+{result.before_after.cta_score.after - result.before_after.cta_score.before})")
        print(f"総合スコア:         {result.before_after.overall_score.before} → {result.before_after.overall_score.after} (+{result.before_after.overall_score.after - result.before_after.overall_score.before})")

        # チェックリスト
        print(f"\n\n✅ 必須項目チェックリスト")
        print("-" * 80)
        passed_count = sum(1 for item in result.checklist if item.passed)
        print(f"合格率: {passed_count}/{len(result.checklist)} ({passed_count/len(result.checklist)*100:.0f}%)\n")
        for item in result.checklist:
            status = "✅" if item.passed else "❌"
            print(f"{status} {item.label}")
            if item.comment:
                print(f"   ({item.comment})")

        # ペルソナ反応
        print(f"\n\n🎯 ペルソナ別反応予測")
        print("-" * 80)
        for persona in result.persona_reactions:
            print(f"\n{persona.reaction_emoji} {persona.persona_name} (スコア: {persona.reaction_score}/100)")
            print(f"   {persona.reason}")

        # 改善版台本
        print(f"\n\n📝 改善版台本")
        print("=" * 80)
        for section in result.revised_sections:
            print(f"\n【{section.label}】({section.timestamp})")
            if section.is_improved:
                print("💡 改善あり:")
                for imp in section.improvements_by_expert:
                    print(f"   • {imp.contribution}")
            print(f"\n{section.revised_content[:200]}...")

        print("\n" + "=" * 80)
        print("✅ テスト完了！")
        print("=" * 80)

        return True

    except Exception as e:
        print(f"\n❌ エラーが発生しました:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_expert_review())
    sys.exit(0 if success else 1)
