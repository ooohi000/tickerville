import { Vector3 } from "three";

/**
 * 카메라가 바라보는 방향을 지면 위 2D 로 눕혀, 화면 기준 위/오른쪽 단위 벡터를 돌려준다.
 * 카메라가 바로 아래를 보고 있어 평면 방향이 사라지면 null (호출 쪽에서 무시).
 */
export const groundDirs = (camera: Vector3, target: Vector3): { up: Vector3; right: Vector3 } | null => {
  const up = new Vector3().subVectors(target, camera);
  up.y = 0;
  if (up.lengthSq() < 1e-6) return null;
  up.normalize();
  const right = new Vector3(-up.z, 0, up.x);
  return { up, right };
};

/** screenRight, screenUp 만큼 지면 위 평행이동 벡터를 계산. */
export const panDelta = (camera: Vector3, target: Vector3, screenRight: number, screenUp: number): Vector3 => {
  const dirs = groundDirs(camera, target);
  if (!dirs) return new Vector3();
  return new Vector3().addScaledVector(dirs.right, screenRight).addScaledVector(dirs.up, screenUp);
};
