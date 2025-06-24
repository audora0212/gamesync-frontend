import os
import json
import argparse

# ────────────────────────────────────────────────────────────
# 스캔할 루트 디렉토리 1단계에서 허용되는 폴더와
# 내용까지 포함할 파일 확장자 정의
# ────────────────────────────────────────────────────────────
ALLOWED_TOP_DIRS = {'app', 'components', 'lib', 'types'}
INCLUDE_CONTENT_EXTENSIONS = {'.ts', '.tsx', '.js'}


def build_tree_with_contents(root_dir: str) -> dict:
    """
    주어진 루트 디렉토리에서 ALLOWED_TOP_DIRS 하위만 순회하며
    ts / tsx / js 파일은 내용까지 포함하는 트리(dict)를 생성.
    """
    tree: dict = {}

    # topdown=True이므로 dirnames를 수정해 불필요한 디렉토리 walk 차단
    for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
        rel_path = os.path.relpath(dirpath, root_dir)

        # 루트 바로 아래에서 허용된 폴더만 계속 탐색
        if rel_path == '.':
            dirnames[:] = [d for d in dirnames if d in ALLOWED_TOP_DIRS]
        else:
            # 최상위 허용 폴더 외의 경로라면 continue (이론상 실행되지 않지만 안전장치)
            top_level = rel_path.split(os.sep, 1)[0]
            if top_level not in ALLOWED_TOP_DIRS:
                dirnames[:] = []   # 하위 탐색 중단
                continue

        # 현재 노드(tree) 위치 계산
        current = tree
        if rel_path != '.':
            for part in rel_path.split(os.sep):
                current = current.setdefault(part, {})

        current_files = {}
        for file in filenames:
            file_ext = os.path.splitext(file)[1].lower()
            if file_ext in INCLUDE_CONTENT_EXTENSIONS:
                file_path = os.path.join(dirpath, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    current_files[file] = content
                except Exception as e:
                    current_files[file] = f"Error reading file: {e}"
            else:
                # 확장자가 조건에 맞지 않을 경우 이름만 기록
                current_files[file] = None

        if current_files:
            current['__files__'] = current_files

    return tree


def save_json(data: dict, output_file: str) -> None:
    """dict 데이터를 JSON 파일로 저장"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def main(src_directory: str, output_file: str) -> None:
    if not os.path.isdir(src_directory):
        print(f"에러: '{src_directory}' 디렉토리가 존재하지 않습니다.")
        return

    tree = build_tree_with_contents(src_directory)
    save_json(tree, output_file)
    print(f"디렉토리 구조가 '{output_file}'에 저장되었습니다.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="app/components/contexts/types 하위의 ts|tsx|js 파일 구조를 JSON으로 내보냅니다."
    )
    parser.add_argument(
        "--src",
        type=str,
        default="./",
        help="탐색할 루트 디렉토리 경로 (기본값: 현재 디렉토리)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="directory_structure.json",
        help="저장할 JSON 파일 이름 (기본값: directory_structure.json)"
    )

    args = parser.parse_args()
    main(args.src, args.output)
