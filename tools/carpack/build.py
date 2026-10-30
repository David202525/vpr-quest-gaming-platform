import os, sys, zipfile, io
PACK = 'amrp_cars'
CARS = [
    dict(m='amrpcar1', name='AMRP Sedan', maker='AMRP', cls='VC_SEDAN', layout='LAYOUT_STANDARD', audio='TAILGATER', mass=1650, drive=0.0, power=0.30, vmax=220, brake=0.85, grip=2.45, seats=4, type='sedan'),
    dict(m='amrpcar2', name='AMRP Sport', maker='AMRP', cls='VC_SPORT', layout='LAYOUT_LOW', audio='ELEGY2', mass=1450, drive=0.0, power=0.38, vmax=265, brake=1.00, grip=2.65, seats=2, type='sport'),
    dict(m='amrpcar3', name='AMRP SUV', maker='AMRP', cls='VC_SUV', layout='LAYOUT_STANDARD', audio='BALLER2', mass=2200, drive=0.5, power=0.32, vmax=230, brake=0.80, grip=2.30, seats=4, type='suv'),
]
PRESET = {
    'sedan': dict(susp=2.0, comp=1.3, reb=1.9, raise_=-0.02, drag=8.0, defl=-0.04, gears=6),
    'sport': dict(susp=2.8, comp=1.6, reb=2.2, raise_=-0.04, drag=6.5, defl=-0.06, gears=7),
    'suv':   dict(susp=1.7, comp=1.1, reb=1.5, raise_=0.0,  drag=9.5, defl=-0.03, gears=6),
}

def vehicles(c):
    return f'''    <Item>
      <modelName>{c['m']}</modelName>
      <txdName>{c['m']}</txdName>
      <handlingId>{c['m'].upper()}</handlingId>
      <gameName>{c['m'].upper()}</gameName>
      <vehicleMakeName>{c['maker'].upper()}</vehicleMakeName>
      <expressionDictName>null</expressionDictName>
      <expressionName>null</expressionName>
      <animConvRoofDictName>null</animConvRoofDictName>
      <animConvRoofName>null</animConvRoofName>
      <animConvRoofWindowsAffected />
      <ptfxAssetName>null</ptfxAssetName>
      <audioNameHash>{c['audio']}</audioNameHash>
      <layout>{c['layout']}</layout>
      <coverBoundOffsets>{'STANDARD_COVER_OFFSET_INFO' if c['type']!='suv' else 'BALLER_COVER_OFFSET_INFO'}</coverBoundOffsets>
      <explosionInfo>EXPLOSION_INFO_DEFAULT</explosionInfo>
      <scenarioLayout />
      <cameraName>DEFAULT_FOLLOW_VEHICLE_CAMERA</cameraName>
      <aimCameraName>DEFAULT_THIRD_PERSON_VEHICLE_AIM_CAMERA</aimCameraName>
      <bonnetCameraName>VEHICLE_BONNET_CAMERA_STANDARD</bonnetCameraName>
      <povCameraName>DEFAULT_POV_CAMERA</povCameraName>
      <FirstPersonDriveByIKOffset x="0.000000" y="-0.060000" z="-0.060000" />
      <FirstPersonDriveByUnarmedIKOffset x="0.000000" y="-0.100000" z="0.000000" />
      <FirstPersonProjectileDriveByIKOffset x="0.000000" y="-0.100000" z="-0.040000" />
      <FirstPersonProjectileDriveByPassengerIKOffset x="0.000000" y="-0.100000" z="-0.040000" />
      <FirstPersonDriveByRightPassengerIKOffset x="0.000000" y="-0.060000" z="-0.060000" />
      <FirstPersonDriveByRightPassengerUnarmedIKOffset x="0.000000" y="-0.100000" z="0.000000" />
      <FirstPersonMobilePhoneOffset x="0.146000" y="0.220000" z="0.535000" />
      <FirstPersonPassengerMobilePhoneOffset x="0.136000" y="0.213000" z="0.425000" />
      <PovCameraOffset x="0.000000" y="-0.195000" z="0.640000" />
      <PovCameraVerticalAdjustmentForRollCage value="0.000000" />
      <PovPassengerCameraOffset x="0.000000" y="0.000000" z="0.000000" />
      <PovRearPassengerCameraOffset x="0.000000" y="0.000000" z="0.000000" />
      <vfxInfoName>VFXVEHICLEINFO_CAR_GENERIC</vfxInfoName>
      <shouldUseCinematicViewMode value="true" />
      <shouldCameraTransitionOnClimbUpDown value="false" />
      <shouldCameraIgnoreExiting value="false" />
      <AllowPretendOccupants value="true" />
      <AllowJoyriding value="true" />
      <AllowSundayDriving value="true" />
      <AllowBodyColorMapping value="true" />
      <wheelScale value="0.250000" />
      <wheelScaleRear value="0.250000" />
      <dirtLevelMin value="0.000000" />
      <dirtLevelMax value="0.300000" />
      <envEffScaleMin value="0.000000" />
      <envEffScaleMax value="1.000000" />
      <envEffScaleMin2 value="0.000000" />
      <envEffScaleMax2 value="1.000000" />
      <damageMapScale value="0.600000" />
      <damageOffsetScale value="1.000000" />
      <diffuseTint value="0x00FFFFFF" />
      <steerWheelMult value="0.700000" />
      <HDTextureDist value="5.000000" />
      <lodDistances content="float_array">
        15.000000
        30.000000
        60.000000
        120.000000
        500.000000
        500.000000
      </lodDistances>
      <minSeatHeight value="0.840000" />
      <identicalModelSpawnDistance value="20" />
      <maxNumOfSameColor value="10" />
      <defaultBodyHealth value="1000.000000" />
      <pretendOccupantsScale value="1.000000" />
      <visibleSpawnDistScale value="1.000000" />
      <trackerPathWidth value="2.000000" />
      <weaponForceMult value="1.000000" />
      <frequency value="0" />
      <swankness>SWANKNESS_4</swankness>
      <maxNum value="999" />
      <flags>FLAG_HAS_LIVERY FLAG_RICH_CAR FLAG_AVERAGE_CAR</flags>
      <type>VEHICLE_TYPE_CAR</type>
      <plateType>VPT_FRONT_AND_BACK_PLATES</plateType>
      <dashboardType>VDT_FEROCI</dashboardType>
      <vehicleClass>{c['cls']}</vehicleClass>
      <wheelType>VWT_SPORT</wheelType>
      <trailers />
      <additionalTrailers />
      <drivers />
      <extraIncludes />
      <doorsWithCollisionWhenClosed />
      <driveableDoors />
      <bumpersNeedToCollideWithMap value="false" />
      <needsRopeTexture value="false" />
      <requiredExtras />
      <rewards />
      <cinematicPartCamera>
        <Item>WHEEL_FRONT_RIGHT_CAMERA</Item>
        <Item>WHEEL_FRONT_LEFT_CAMERA</Item>
        <Item>WHEEL_REAR_RIGHT_CAMERA</Item>
        <Item>WHEEL_REAR_LEFT_CAMERA</Item>
      </cinematicPartCamera>
      <NmBraceOverrideSet />
      <buoyancySphereOffset x="0.000000" y="0.000000" z="0.000000" />
      <buoyancySphereSizeScale value="1.000000" />
      <pOverrideRagdollThreshold type="NULL" />
      <firstPersonDrivebyData>
        <Item>STD_FEROCI_FRONT_LEFT</Item>
        <Item>STD_FEROCI_FRONT_RIGHT</Item>
{'''        <Item>STD_FEROCI_REAR_LEFT</Item>
        <Item>STD_FEROCI_REAR_RIGHT</Item>
''' if c['seats']>2 else ''}      </firstPersonDrivebyData>
    </Item>
'''

def handling(c):
    p = PRESET[c['type']]
    return f'''    <Item type="CHandlingData">
      <handlingName>{c['m'].upper()}</handlingName>
      <fMass value="{c['mass']:.1f}" />
      <fInitialDragCoeff value="{p['drag']:.4f}" />
      <fPercentSubmerged value="85.0000" />
      <vecCentreOfMassOffset x="0.000000" y="0.000000" z="{-0.05 if c['type']=='sport' else 0.0:.6f}" />
      <vecInertiaMultiplier x="1.000000" y="1.200000" z="1.400000" />
      <fDriveBiasFront value="{c['drive']:.6f}" />
      <nInitialDriveGears value="{p['gears']}" />
      <fInitialDriveForce value="{c['power']:.6f}" />
      <fDriveInertia value="1.000000" />
      <fClutchChangeRateScaleUpShift value="{3.5 if c['type']=='sport' else 2.5:.6f}" />
      <fClutchChangeRateScaleDownShift value="{3.5 if c['type']=='sport' else 2.5:.6f}" />
      <fInitialDriveMaxFlatVel value="{c['vmax']/1.32:.6f}" />
      <fBrakeForce value="{c['brake']:.6f}" />
      <fBrakeBiasFront value="0.600000" />
      <fHandBrakeForce value="0.800000" />
      <fSteeringLock value="{38.0 if c['type']=='suv' else 40.0:.6f}" />
      <fTractionCurveMax value="{c['grip']:.6f}" />
      <fTractionCurveMin value="{c['grip']-0.25:.6f}" />
      <fTractionCurveLateral value="22.500000" />
      <fTractionSpringDeltaMax value="0.150000" />
      <fLowSpeedTractionLossMult value="{0.8 if c['type']=='sport' else 0.6:.6f}" />
      <fCamberStiffnesss value="0.000000" />
      <fTractionBiasFront value="0.485000" />
      <fTractionLossMult value="1.000000" />
      <fSuspensionForce value="{p['susp']:.6f}" />
      <fSuspensionCompDamp value="{p['comp']:.6f}" />
      <fSuspensionReboundDamp value="{p['reb']:.6f}" />
      <fSuspensionUpperLimit value="{0.12 if c['type']=='suv' else 0.08:.6f}" />
      <fSuspensionLowerLimit value="{-0.15 if c['type']=='suv' else -0.10:.6f}" />
      <fSuspensionRaise value="{p['raise_']:.6f}" />
      <fSuspensionBiasFront value="0.500000" />
      <fAntiRollBarForce value="{0.9 if c['type']=='sport' else 0.6:.6f}" />
      <fAntiRollBarBiasFront value="0.550000" />
      <fRollCentreHeightFront value="0.300000" />
      <fRollCentreHeightRear value="0.300000" />
      <fCollisionDamageMult value="0.800000" />
      <fWeaponDamageMult value="1.000000" />
      <fDeformationDamageMult value="0.700000" />
      <fEngineDamageMult value="1.500000" />
      <fPetrolTankVolume value="65.000000" />
      <fOilVolume value="5.000000" />
      <fSeatOffsetDistX value="0.000000" />
      <fSeatOffsetDistY value="0.000000" />
      <fSeatOffsetDistZ value="0.000000" />
      <nMonetaryValue value="100000" />
      <strModelFlags>440010</strModelFlags>
      <strHandlingFlags>{'20000' if c['type']!='suv' else '0'}</strHandlingFlags>
      <strDamageFlags>0</strDamageFlags>
      <AIHandling>{'SPORTS_CAR' if c['type']=='sport' else 'AVERAGE'}</AIHandling>
      <SubHandlingData>
        <Item type="CCarHandlingData">
          <fBackEndPopUpCarImpulseMult value="0.100000" />
          <fBackEndPopUpBuildingImpulseMult value="0.030000" />
          <fBackEndPopUpMaxDeltaSpeed value="0.600000" />
          <fToeFront value="0.000000" />
          <fToeRear value="0.000000" />
          <fCamberFront value="0.000000" />
          <fCamberRear value="0.000000" />
          <fCastor value="0.000000" />
          <fEngineResistance value="0.000000" />
          <fMaxDriveBiasTransfer value="-1.000000" />
          <fJumpForceScale value="1.000000" />
          <fIncreasedRammingForceScale value="1.000000" />
          <strAdvancedFlags>0</strAdvancedFlags>
          <AdvancedData />
        </Item>
        <Item type="NULL" />
        <Item type="NULL" />
      </SubHandlingData>
    </Item>
'''

def variation(c, i):
    return f'''    <Item>
      <modelName>{c['m']}</modelName>
      <colors>
        <Item><indices content="char_array">0 0 0 156</indices><liveries><Item value="false" /></liveries></Item>
        <Item><indices content="char_array">111 111 0 156</indices><liveries><Item value="false" /></liveries></Item>
        <Item><indices content="char_array">4 4 0 156</indices><liveries><Item value="false" /></liveries></Item>
        <Item><indices content="char_array">27 27 0 156</indices><liveries><Item value="false" /></liveries></Item>
        <Item><indices content="char_array">64 64 0 156</indices><liveries><Item value="false" /></liveries></Item>
      </colors>
      <kits>
        <Item>{1300 + i}_{c['m']}_modkit</Item>
      </kits>
      <windowsWithExposedEdges />
      <plateProbabilities>
        <Probabilities>
          <Item><Name>Standard White</Name><Value value="100" /></Item>
        </Probabilities>
      </plateProbabilities>
      <lightSettings value="1" />
      <sirenSettings value="0" />
    </Item>
'''

def kit(c, i):
    return f'''    <Item>
      <kitName>{1300 + i}_{c['m']}_modkit</kitName>
      <id value="{1300 + i}" />
      <kitType>MKT_SPECIAL</kitType>
      <visibleMods />
      <linkMods />
      <statMods>
        <Item><identifier /><modifier value="25" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ENGINE</type></Item>
        <Item><identifier /><modifier value="50" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ENGINE</type></Item>
        <Item><identifier /><modifier value="75" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ENGINE</type></Item>
        <Item><identifier /><modifier value="100" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ENGINE</type></Item>
        <Item><identifier /><modifier value="25" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_BRAKES</type></Item>
        <Item><identifier /><modifier value="50" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_BRAKES</type></Item>
        <Item><identifier /><modifier value="100" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_BRAKES</type></Item>
        <Item><identifier /><modifier value="25" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_GEARBOX</type></Item>
        <Item><identifier /><modifier value="50" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_GEARBOX</type></Item>
        <Item><identifier /><modifier value="100" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_GEARBOX</type></Item>
        <Item><identifier /><modifier value="20" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ARMOUR</type></Item>
        <Item><identifier /><modifier value="40" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ARMOUR</type></Item>
        <Item><identifier /><modifier value="60" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ARMOUR</type></Item>
        <Item><identifier /><modifier value="80" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ARMOUR</type></Item>
        <Item><identifier /><modifier value="100" /><audioApply value="1.000000" /><weight value="20" /><type>VMT_ARMOUR</type></Item>
        <Item><identifier /><modifier value="20" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_SUSPENSION</type></Item>
        <Item><identifier /><modifier value="40" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_SUSPENSION</type></Item>
        <Item><identifier /><modifier value="60" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_SUSPENSION</type></Item>
        <Item><identifier /><modifier value="100" /><audioApply value="1.000000" /><weight value="5" /><type>VMT_SUSPENSION</type></Item>
      </statMods>
      <slotNames />
      <liveryNames />
    </Item>
'''

def files():
    F = {}
    F['dlc.rpf/setup2.xml'] = f'''<?xml version="1.0" encoding="UTF-8"?>
<SSetupData>
  <deviceName>dlc_{PACK}</deviceName>
  <datFile>content.xml</datFile>
  <timeStamp>10/31/2026 12:00:00</timeStamp>
  <nameHash>{PACK}</nameHash>
  <contentChangeSets />
  <contentChangeSetGroups>
    <Item>
      <NameHash>GROUP_STARTUP</NameHash>
      <ContentChangeSets>
        <Item>{PACK.upper()}_AUTOGEN</Item>
      </ContentChangeSets>
    </Item>
  </contentChangeSetGroups>
  <startupScript />
  <scriptCallstackSize value="0" />
  <type>EXTRACONTENT_COMPAT_PACK</type>
  <order value="31" />
  <minorOrder value="0" />
  <isLevelPack value="false" />
  <dependencyPackHash />
  <requiredVersion />
  <subPackCount value="0" />
</SSetupData>
'''
    d = f'dlc_{PACK}:/'
    metas = [('handling.meta', 'HANDLING_FILE'), ('vehicles.meta', 'VEHICLE_METADATA_FILE'), ('carcols.meta', 'CARCOLS_FILE'), ('carvariations.meta', 'VEHICLE_VARIATION_FILE')]
    df = ''.join(f'''    <Item>
      <filename>{d}common/data/{n}</filename>
      <fileType>{t}</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="false" />
    </Item>
''' for n, t in metas)
    df += f'''    <Item>
      <filename>{d}%PLATFORM%/vehicles.rpf</filename>
      <fileType>RPF_FILE</fileType>
      <overlay value="false" />
      <disabled value="true" />
      <persistent value="true" />
    </Item>
'''
    files_list = ''.join(f'        <Item>{d}common/data/{n}</Item>\n' for n, _ in metas) + f'        <Item>{d}%PLATFORM%/vehicles.rpf</Item>\n'
    F['dlc.rpf/content.xml'] = f'''<?xml version="1.0" encoding="UTF-8"?>
<CDataFileMgr__ContentsOfDataFileXml>
  <disabledFiles />
  <includedXmlFiles />
  <includedDataFiles />
  <dataFiles>
{df}  </dataFiles>
  <contentChangeSets>
    <Item>
      <changeSetName>{PACK.upper()}_AUTOGEN</changeSetName>
      <mapChangeSetData />
      <filesToInvalidate />
      <filesToDisable />
      <filesToEnable>
{files_list}      </filesToEnable>
      <txdToLoad />
      <txdToUnload />
      <residentResources />
      <unregisterResources />
    </Item>
  </contentChangeSets>
  <patchFiles />
</CDataFileMgr__ContentsOfDataFileXml>
'''
    base = 'dlc.rpf/common/data/'
    F[base + 'vehicles.meta'] = f'''<?xml version="1.0" encoding="UTF-8"?>
<CVehicleModelInfo__InitDataList>
  <residentTxd>vehshare</residentTxd>
  <residentAnims />
  <InitDatas>
{''.join(vehicles(c) for c in CARS)}  </InitDatas>
  <txdRelationships>
{''.join(f"""    <Item>
      <parent>vehicles_generic</parent>
      <child>{c['m']}</child>
    </Item>
""" for c in CARS)}  </txdRelationships>
</CVehicleModelInfo__InitDataList>
'''
    F[base + 'handling.meta'] = f'''<?xml version="1.0" encoding="UTF-8"?>
<CHandlingDataMgr>
  <HandlingData>
{''.join(handling(c) for c in CARS)}  </HandlingData>
</CHandlingDataMgr>
'''
    F[base + 'carvariations.meta'] = f'''<?xml version="1.0" encoding="UTF-8"?>
<CVehicleModelInfoVariation>
  <variationData>
{''.join(variation(c, i) for i, c in enumerate(CARS))}  </variationData>
</CVehicleModelInfoVariation>
'''
    F[base + 'carcols.meta'] = f'''<?xml version="1.0" encoding="UTF-8"?>
<CVehicleModelInfoVarGlobal>
  <Kits>
{''.join(kit(c, i) for i, c in enumerate(CARS))}  </Kits>
  <Lights />
  <Sirens />
</CVehicleModelInfoVarGlobal>
'''
    F['dlc.rpf/x64/vehicles.rpf/СЮДА_МОДЕЛИ.txt'] = 'Положите сюда файлы моделей для каждой машины:\n' + ''.join(f"  {c['m']}.yft, {c['m']}_hi.yft, {c['m']}.ytd\n" for c in CARS) + '\nИмена файлов должны совпадать с modelName в vehicles.meta.\nЭтот txt-файл перед сборкой удалите.\n'
    F['names.txt'] = 'Названия машин (вставить в global.gxt2 через OpenIV или оставить — сервер покажет свои названия):\n' + ''.join(f"  {c['m'].upper()} = {c['name']}\n  {c['maker'].upper()} = {c['maker']}\n" for c in CARS)
    F['README.txt'] = README
    F['common_pack/README.txt'] = COMMON
    return F

README = f'''ПАК МАШИН {PACK} — ШАБЛОН ПОД ВАШИ МОДЕЛИ

Внутри уже готовы все настройки на 3 машины:
  amrpcar1 — седан (задний привод, ~220 км/ч, звук Tailgater)
  amrpcar2 — спорткар (задний привод, ~265 км/ч, звук Elegy)
  amrpcar3 — внедорожник (полный привод, ~230 км/ч, звук Baller)

КАК ПОДСТАВИТЬ СВОЮ МАШИНУ
1. Возьмите модель, например m5f90.yft, m5f90_hi.yft, m5f90.ytd.
2. Во всех 4 файлах в common/data замените amrpcar1 на m5f90 (Ctrl+H в Notepad++,
   «Заменить все», регистр не учитывать — заменится и AMRPCAR1 в handling).
3. Положите 3 файла модели в x64/vehicles.rpf/.
Нужно меньше машин — удалите лишний блок <Item>...</Item> во всех 4 файлах.
Нужно больше — скопируйте блок и поменяйте имя (в carvariations и carcols поменяйте
ещё номер набора тюнинга 1300/1301/1302 на следующий свободный, например 1303).

КАК СОБРАТЬ В OpenIV
1. OpenIV → Tools → New → RPF7 Archive, назовите dlc.rpf (Encryption: OPEN).
2. Перенесите внутрь content.xml, setup2.xml и папку common целиком.
3. Внутри dlc.rpf создайте папку x64, в ней New → RPF7 Archive «vehicles.rpf»
   и перетащите туда .yft/.ytd.
4. Готовый dlc.rpf положите на сервер: client_packages/game_resources/dlcpacks/{PACK}/dlc.rpf
5. Перезапустите сервер — проверка [dlc] в консоли должна показать «{PACK}: OK».
6. В игре: /adddlc m5f90 BMW M5 F90 — машина появится в списке DLC админки.

ЧТО МОЖНО КРУТИТЬ (handling.meta)
  fInitialDriveForce — мощность (0.30 обычная, 0.40 очень быстрая)
  fInitialDriveMaxFlatVel — макс. скорость (км/ч ≈ значение × 1.32)
  fDriveBiasFront — привод: 0.0 задний, 0.5 полный, 1.0 передний
  fTractionCurveMax / Min — сцепление (2.4–2.8)
  fBrakeForce — тормоза (0.8–1.2)
  fMass — масса, кг
Звук: в vehicles.meta тег <audioNameHash> — имя любой машины GTA (ADDER, ZENTORNO, SULTAN и т.д.).
'''
COMMON = '''ПАК ДЛЯ ОБЩИХ РЕСУРСОВ (common)

Если у нескольких машин общие текстуры (например одинаковые диски или салон),
не кладите их в каждую машину — положите один раз сюда:
1. Создайте dlc.rpf так же, как для машин, но в content.xml оставьте только
   RPF_FILE на %PLATFORM%/vehicles.rpf.
2. В vehicles.meta машин в разделе <txdRelationships> укажите parent = имя общего .ytd.

Обычно для простого пака машин это НЕ нужно — хватает основного пака.
'''

out = sys.argv[1]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for k, v in files().items():
        z.writestr(f'{PACK}/' + k, v.encode('utf-8'))
print('ok', out)
